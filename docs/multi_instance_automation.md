# Multi-Instance Automation System

## Overview
This document describes the multi-instance automation system that allows running multiple Chrome automation instances concurrently with proper window positioning and instance management.

## Architecture

### Core Components

#### 1. Type System (`src/types/automation.types.ts`)
Defines the core types for the multi-instance system:
- `InstanceState`: Tracks each running instance's state
- `InstanceStatus`: running | stopped | error | completed
- `WindowPositioningConfig`: Configuration for window grid layout
- `LaunchInstanceRequest`/`Response`: API types for launching instances

#### 2. Screen Positioner (`src/services/automation/screen-positioner.ts`)
Manages window positioning on screen:
- **Grid Layout**: Configurable columns × rows grid (default: 3×2)
- **Slot Management**: Tracks available/occupied slots
- **Bounds Calculation**: Computes x, y, width, height for each slot
- **Direction Support**: Horizontal or vertical filling
- **Gap & Padding**: Configurable spacing between windows

Default Configuration:
```typescript
{
  gridColumns: 3,
  gridRows: 2,
  windowWidth: 1024,
  windowHeight: 768,
  gapX: 10,
  gapY: 10,
  paddingX: 10,
  paddingY: 10,
  direction: 'horizontal',
  maxConcurrent: 6
}
```

#### 3. Instance Manager (`src/services/automation/instance-manager.ts`)
Singleton service that manages all running instances:
- **Registry**: `Map<instanceId, InstanceState>` - tracks all instances
- **Profile Locking**: `Set<profileId>` - prevents duplicate profile launches
- **Event Emitter**: Broadcasts state changes to all listeners

Events:
- `instance:registered` - New instance started
- `instance:updated` - Instance state changed
- `instance:status` - Instance status changed
- `instance:unregistered` - Instance stopped

Methods:
- `registerInstance()` - Add new instance to registry
- `unregisterInstance()` - Remove instance from registry
- `updateInstanceState()` - Update instance properties
- `updateInstanceStatus()` - Update instance status
- `canLaunchProfile()` - Check if profile can be launched
- `lockProfile()` / `unlockProfile()` - Manage profile locks

#### 4. Automation Coordinator (`src/services/automation/automation-coordinator.ts`)
Orchestrates instance lifecycle:
- **Launch**: Creates instance, assigns screen slot, launches automation
- **Stop**: Stops automation, releases slot, unregisters instance
- **Broadcast**: Forwards events to renderer processes

Flow:
1. Receive launch request with profileId and provider
2. Check profile lock and concurrent limit
3. Assign screen slot from positioner
4. Create instance state
5. Register instance with manager
6. Launch automation service
7. Update instance with session details
8. Emit registered event

#### 5. IPC Handlers (`src/main/handlers/automation-multi.handlers.ts`)
Exposes APIs to renderer process:
- `automation:launch` - Launch new instance
- `automation:stopInstance` - Stop specific instance (multi-instance channel)
- `automation:stopAll` - Stop all instances
- `automation:getInstances` - Get all running instances (multi-instance list)
- `automation:getInstance` - Get specific instance by instanceId
- `automation:sendMessage` - Send message to instance
- `automation:highlight` - Highlight window (TODO)
- `automation:updateConfig` - Update positioning config
- `automation:getConfig` - Get positioning config

Note: The dashboard UI displays the assigned `screenSlot` and `windowBounds` when available so you can visually map cards to screen positions.

### Frontend Components

#### 1. Automation Dashboard (`src/renderer/pages/automation/AutomationDashboard.tsx`)
Main dashboard for managing multiple instances:

**Features:**
- Profile and provider selection
- Launch instances with Run button
- Grid of instance cards matching screen layout
- Real-time status updates via event listeners
- Navigate to instance detail page
- Stop individual or all instances

**Instance Card:**
- Profile name and avatar
- Status badge (running/stopped/error)
- Uptime counter
- Chat and Stop action buttons
- Hover to highlight window (TODO)

**Event Handling:**
- Listens to all instance events
- Updates UI in real-time
- Maintains instance list in state

#### 2. Chat Automation (`src/renderer/pages/automation/ChatAutomation.tsx`)
Dual-mode chat interface:

**Single-Instance Mode** (no route param):
- Original behavior preserved
- Profile/provider selector
- Run button to initialize session
- Uses `chatAutomation` IPC APIs

**Multi-Instance Mode** (with `instanceId` route param):
- Back button to dashboard
- No toolbar (instance already running)
- Connects to existing instance
- Uses `automation.sendMessage()` IPC API
- Real-time status updates

**Route:**
- Single: `/automation/chat`
- Multi: `/automation/:instanceId/chat`

#### 3. Sidebar Navigation (`src/renderer/components/Sidebar.tsx`)
Updated with new navigation:
- **Automation** submenu:
  - Dashboard → `/automation/dashboard`
  - Chat (Single) → `/automation/chat`
- Uses React Router `navigate()` for routing

### Data Flow

#### Launch Instance Flow:
```
User clicks Run
  ↓
Dashboard calls automation.launch(request)
  ↓
IPC Handler → Coordinator.launchInstance()
  ↓
1. Check profile lock
2. Assign screen slot
3. Create instance state
4. Register with manager
5. Launch automation service
6. Update instance with session
  ↓
Manager emits 'instance:registered'
  ↓
Coordinator broadcasts to renderer
  ↓
Dashboard receives event, updates UI
```

#### Send Message Flow:
```
User sends message in chat
  ↓
ChatAutomation calls automation.sendMessage(instanceId, text)
  ↓
IPC Handler → chatAutomationService.sendMessage(sessionId, text)
  ↓
Service communicates with browser via CDP
  ↓
Response returned through IPC
  ↓
ChatAutomation displays response
```

#### Stop Instance Flow:
```
User clicks Stop
  ↓
Dashboard calls automation.stopInstance(instanceId)
  ↓
IPC Handler → Coordinator.stopInstance()
  ↓
1. Stop automation service
2. Release screen slot
3. Unlock profile
4. Unregister instance
  ↓
Manager emits 'instance:unregistered'
  ↓
Coordinator broadcasts to renderer
  ↓
Dashboard receives event, removes instance from grid
```

## Configuration

### Window Positioning Config
Stored in coordinator, accessible via:
- `automation.getConfig()` - Get current config
- `automation.updateConfig(config)` - Update config

Properties:
- `gridColumns`: Number of columns (default: 3)
- `gridRows`: Number of rows (default: 2)
- `windowWidth`: Window width in pixels (default: 1024)
- `windowHeight`: Window height in pixels (default: 768)
- `gapX`: Horizontal gap between windows (default: 10)
- `gapY`: Vertical gap between windows (default: 10)
- `paddingX`: Screen horizontal padding (default: 10)
- `paddingY`: Screen vertical padding (default: 10)
- `direction`: Fill direction - 'horizontal' | 'vertical' (default: 'horizontal')
- `maxConcurrent`: Maximum concurrent instances (default: 6)

## Future Enhancements

### TODO Items:

1. **CDP Window Positioning**
   - Implement `Browser.setWindowBounds` CDP command
   - Apply calculated bounds after browser launch
   - Handle multi-monitor scenarios

2. **Window Highlighting**
   - Implement native window focusing on hover
   - Options: node-window-manager, CDP overlay, OS APIs

3. **Session Cleanup**
   - Proper browser close on stop
   - Resource cleanup
   - Error recovery

4. **Settings Modal**
   - UI for editing WindowPositioningConfig
   - Live preview of grid layout
   - Save/load presets

5. **Worker Processes**
   - Move automation execution to worker threads
   - Prevent main process blocking
   - Better concurrency handling

6. **Error Handling**
   - Retry logic for failed launches
   - Timeout handling
   - Better error messages

7. **Instance Recovery**
   - Persist instances across app restarts
   - Reconnect to existing browser sessions
   - State restoration

## Usage

### Launch Multiple Instances:
1. Navigate to Automation → Dashboard
2. Select profile from dropdown
3. Select provider (ChatGPT/Gemini)
4. Click Run
5. Repeat for multiple profiles

### Chat with Instance:
1. Click "Chat" button on instance card
2. Send messages in chat interface
3. Click back arrow to return to dashboard

### Stop Instances:
- Stop individual: Click "Stop" on instance card
- Stop all: Click "Stop All" button in toolbar

## Files Created/Modified

### New Files:
- `src/types/automation.types.ts`
- `src/services/automation/screen-positioner.ts`
- `src/services/automation/instance-manager.ts`
- `src/services/automation/automation-coordinator.ts`
- `src/main/handlers/automation-multi.handlers.ts`
- `src/renderer/types/electron-api.d.ts`
- `src/renderer/pages/automation/AutomationDashboard.tsx`

### Modified Files:
- `src/main/handlers/index.ts` - Added registerAutomationMultiHandlers
- `src/main/preload.ts` - Added automation multi APIs
- `src/renderer/App.tsx` - Added React Router routes
- `src/renderer/components/Sidebar.tsx` - Added Dashboard navigation
- `src/renderer/pages/automation/ChatAutomation.tsx` - Added multi-instance support
- `src/renderer/vite-env.d.ts` - Updated type definitions
- `src/utils/string.util.ts` - Added generateRandomString
- `package.json` - Added react-router-dom

## Dependencies

New dependency added:
- `react-router-dom` - For SPA routing

Existing dependencies used:
- `lucide-react` - Icons
- `react` - UI framework
- `electron` - Desktop framework
- Event emitter pattern for state management
