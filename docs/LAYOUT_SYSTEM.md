# Multi-Instance Layout System - Complete Implementation Guide

## Overview
This document describes the complete multi-instance automation layout system implemented for VEO3-AUTO, including window positioning, layout presets, and native OS fallbacks.

## Features Implemented

### 1. Layout Presets
The system supports the following layout presets accessible via visual icons in the dashboard:

- **1x1 (Fullscreen Each)**: Each instance occupies the full screen work area
- **1x2 Vertical**: Two columns, each taking half the screen width
- **1x2 Horizontal**: Two rows, each taking half the screen height
- **2x2 Grid**: 2 columns × 2 rows grid layout
- **4x4 Grid**: 4 columns × 4 rows grid layout
- **Cascade**: Overlapping windows with offset positioning

### 2. Compact Mode
- Toggle to remove gaps between windows
- Maintains a small 8px inset from screen edges
- Works with all grid-based presets

### 3. Active Preset Highlighting
- Visual indication of currently active layout
- Icons show primary color border and background when active
- Automatic detection based on current grid configuration

### 4. Window Positioning System

#### Screen Positioner (`src/services/automation/screen-positioner.ts`)
**Features:**
- Dynamic grid sizing based on display work area
- Effective grid computation (CSS-grid-like behavior when instances < grid cells)
- Deterministic slot allocation with cycling
- Direction and corner preferences (left-right, right-left, top-bottom, bottom-top)
- Cascade strategy with configurable offsets
- Compact mode support

**Key Methods:**
- `getNextAvailableSlot()`: Allocates slots deterministically
- `calculateWindowBounds(slot, displayId?, activeCount?)`: Computes window position and size
- `updateConfig(config)`: Updates positioning configuration
- `reset()`: Clears all occupied slots

#### Automation Coordinator (`src/services/automation/automation-coordinator.ts`)
**Responsibilities:**
- Orchestrates instance lifecycle (launch, stop, reposition)
- Applies layout presets and recalculates bounds
- Manages CDP-based repositioning with native fallback
- Broadcasts events to renderer windows

**Key Methods:**
- `launchInstance(request)`: Creates and positions new instance
- `stopInstance(instanceId)`: Stops instance and releases slot
- `applyPreset(preset)`: Changes layout and repositions all instances
- `repositionInstance(instanceId)`: Moves a single window
- `repositionAll()`: Repositions all running instances

### 5. Multi-Layer Positioning Strategy

The system uses a three-tier approach for window positioning:

1. **CDP (Chrome DevTools Protocol)** - Primary method
   - Uses `Browser.setWindowBounds` via Puppeteer
   - Fast and reliable when supported
   - Works cross-platform

2. **Native (node-window-manager)** - Secondary fallback
   - Uses native OS APIs when available
   - More reliable on Windows
   - Optional dependency (doesn't block installation)

3. **PowerShell (Windows only)** - Final fallback
   - P/Invokes user32.dll MoveWindow
   - Works on Windows without additional dependencies
   - Safe fallback for locked-down systems

**Implementation:**
```typescript
// src/utils/native-window.util.ts
export function moveWindowByPid(pid, x, y, width, height): boolean {
  // Try node-window-manager first
  if (nativeAvailable) {
    // Use native API
  }
  
  // Fallback to PowerShell
  return psMove(pid, x, y, width, height);
}
```

### 6. UI Components

#### AutomationDashboard (`src/renderer/pages/automation/AutomationDashboard.tsx`)
**Features:**
- Visual preset picker with icons
- Active preset highlighting
- Hover preview (shows layout schematic)
- Compact mode toggle
- Positioned to the right of toolbar
- Real-time config synchronization

**Layout Detection Logic:**
```typescript
const activePreset = (() => {
  const cols = config?.grid?.columns;
  const rows = config?.grid?.rows;
  const strategy = config?.strategy;
  const fullscreen = config?.grid?.fullscreenEach;
  
  if (strategy === 'cascade') return 'cascade';
  if (fullscreen && cols === 1 && rows === 1) return '1x1';
  if (cols === 1 && rows === 2) return '1x2-vertical';
  if (cols === 2 && rows === 1) return '1x2-horizontal';
  if (cols === 2 && rows === 2) return '2x2';
  if (cols === 4 && rows === 4) return '4x4';
  
  return '';
})();
```

#### LayoutPreview Component
- Shows visual representation of preset on hover
- SVG-based schematic of grid/cascade layout
- 140×80px preview window

### 7. Instance Manager (`src/services/automation/instance-manager.ts`)
**Features:**
- Singleton instance registry
- Profile locking (prevents duplicate launches)
- Event emission for renderer updates
- Instance state management

**Events:**
- `instance:registered` - New instance created
- `instance:updated` - Instance state changed
- `instance:status` - Status update
- `instance:unregistered` - Instance removed

### 8. IPC Handlers (`src/main/handlers/automation-multi.handlers.ts`)
**Endpoints:**
- `automation:launch` - Launch new instance
- `automation:stopInstance` - Stop specific instance
- `automation:stopAll` - Stop all instances
- `automation:getInstances` - Get all running instances
- `automation:getInstance` - Get specific instance
- `automation:applyPreset` - Apply layout preset
- `automation:repositionInstance` - Reposition single window
- `automation:repositionAll` - Reposition all windows
- `automation:updateConfig` - Update positioning config
- `automation:getConfig` - Get current config

## Configuration

### Default Window Config (`src/services/automation/screen-positioner.ts`)
```typescript
export const DEFAULT_WINDOW_CONFIG: WindowPositioningConfig = {
  strategy: 'grid',
  grid: {
    columns: 3,
    rows: 2,
    direction: 'left-right',
    startCorner: 'top-left',
    gap: { x: 10, y: 10 },
    fullscreenEach: false,
    compact: false,
    padding: { top: 50, left: 20, right: 20, bottom: 50 },
  },
  cascade: {
    offsetX: 50,
    offsetY: 50,
    startX: 100,
    startY: 100,
  },
  defaultSize: { width: 1024, height: 768 },
  preferredDisplay: 'primary',
  maxConcurrent: 6,
};
```

## Usage

### Launching Instances
1. Select a profile from the dropdown
2. Choose provider (Gemini/ChatGPT)
3. Click "Run" button
4. Instance is automatically positioned in next available slot

### Changing Layout
1. Click any preset icon in the toolbar (right side)
2. All running instances are immediately repositioned
3. Active preset is highlighted with primary color

### Using Compact Mode
1. Check the "Compact" checkbox
2. Gaps between windows are removed
3. Small 8px inset is maintained for safety

### Stopping Instances
- **Single**: Click "Stop" button on instance card
- **All**: Click "Stop All (n)" button in toolbar

## Technical Details

### Slot Allocation Algorithm
```typescript
getNextAvailableSlot(): number {
  const maxSlots = columns * rows;
  
  // Find free slot starting from nextSlotIndex
  for (let offset = 0; offset < maxSlots; offset++) {
    const idx = (this.nextSlotIndex + offset) % maxSlots;
    if (!this.occupiedSlots.has(idx)) {
      this.occupiedSlots.add(idx);
      this.nextSlotIndex = (idx + 1) % maxSlots;
      return idx;
    }
  }
  
  // All slots occupied, cycle and overlap
  const slot = this.nextSlotIndex % maxSlots;
  this.nextSlotIndex = (this.nextSlotIndex + 1) % maxSlots;
  return slot;
}
```

### Effective Grid Sizing
When the number of active instances is less than the configured grid cells, the system computes an "effective grid" to better utilize screen space:

```typescript
if (activeCount && activeCount > 0 && activeCount < totalCells) {
  effColumns = Math.min(columns, activeCount);
  effRows = Math.max(1, Math.ceil(activeCount / effColumns));
}
```

Example: With 2x2 grid (4 cells) but only 2 instances:
- Effective grid becomes 2×1 (horizontal split)
- Windows are larger and better positioned

### Browser Process Management
Each browser instance is tracked with:
- Puppeteer Browser object
- Debug port number
- Spawned ChildProcess reference

On stop:
1. Close session via ChatAutomationService
2. Disconnect/close browser via Puppeteer
3. Kill underlying Chrome process
4. Release screen slot
5. Unregister instance

## Dependencies

### Core
- `puppeteer` / `puppeteer-core`: Browser automation
- `electron`: Desktop framework
- `react`: UI framework

### Optional
- `node-window-manager`: Native window control (recommended)

## Files Modified/Created

### New Files
- `src/services/automation/screen-positioner.ts` - Window positioning logic
- `src/services/automation/automation-coordinator.ts` - Instance orchestrator
- `src/services/automation/instance-manager.ts` - Instance registry
- `src/main/handlers/automation-multi.handlers.ts` - IPC handlers
- `src/renderer/pages/automation/AutomationDashboard.tsx` - Dashboard UI
- `src/utils/native-window.util.ts` - Native positioning utility
- `src/utils/windows.util.ts` - PowerShell fallback utility
- `docs/LAYOUT_SYSTEM.md` - This documentation

### Modified Files
- `src/types/automation.types.ts` - Added types for multi-instance
- `src/main/preload.ts` - Exposed IPC APIs to renderer
- `src/renderer/types/electron-api.d.ts` - TypeScript definitions
- `package.json` - Added optional dependency

## Troubleshooting

### Windows Not Repositioning
1. Check browser process is registered with PID
2. Verify Chrome has MainWindowHandle (not headless)
3. Check logs for CDP errors
4. Ensure node-window-manager is installed for native fallback
5. Verify PowerShell execution is not blocked

### Instances Overlapping
- Reset slots: Stop all instances and relaunch
- Check max slots vs active instances
- Verify effective grid calculation

### Layout Not Changing
- Ensure applyPreset is called with correct preset name
- Check config.strategy is set to 'grid' for grid presets
- Verify repositionAll is being triggered after preset change

## Future Enhancements

### Planned
- [ ] Multi-display support with display selection
- [ ] Custom grid size configuration in UI
- [ ] Save/load layout presets
- [ ] Drag-and-drop window reordering
- [ ] Animation during repositioning
- [ ] Window snapping and resize handles

### Recommended
- [ ] Unit tests for ScreenPositioner
- [ ] Integration tests for coordinator
- [ ] Performance profiling for large instance counts
- [ ] Accessibility improvements for keyboard navigation

## Performance Considerations

### Optimal Instance Count
- 1-4 instances: Excellent performance
- 5-8 instances: Good performance
- 9-16 instances: May experience slight delays during repositioning
- 16+ instances: Consider staggered launches

### Memory Usage
- Each Chrome instance: ~150-300MB base
- With loaded pages: ~300-500MB per instance
- Recommended system RAM: 8GB minimum for 4-6 instances

## Conclusion

The multi-instance layout system provides a robust, flexible, and user-friendly way to manage multiple automation instances with automatic window positioning and native OS integration. The three-tier fallback strategy ensures reliability across different environments and configurations.
