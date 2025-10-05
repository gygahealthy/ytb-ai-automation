# Chat Automation Refactoring Summary

## Overview
Refactored the chat automation system to use a dedicated service with CDP (Chrome DevTools Protocol) monitoring for real-time message streaming from ChatGPT and Gemini.

## Changes Made

### 1. Shared Browser Manager (`src/services/browser-manager.ts`)
**Purpose**: Extracted browser spawning logic from ProfileService into a reusable utility

**Key Features**:
- `launchBrowserWithDebugging()` - Launches Chrome with remote debugging
- Uses PowerShell `spawn` to start Chrome process with debugging port
- Automatic port allocation (9222 + random)
- Retry logic for connecting to debugging port (10 attempts)
- Cross-platform Chrome path detection
- Browser instance registry for session management

**Benefits**:
- Reusable across multiple automation services
- Centralized browser lifecycle management
- Better error handling and logging

### 2. Chat Automation Service (`src/services/chat-automation/chat-automation.service.ts`)
**Purpose**: Dedicated service for chat automation with CDP monitoring

**Key Features**:
- `initSession()` - Initialize chat session with profile and provider
- `sendMessage()` - Send message and wait for streaming response
- `closeSession()` - Cleanup session and browser
- CDP session monitoring for network requests
- Real-time message chunk processing
- Support for ChatGPT (implemented) and Gemini (placeholder)

**CDP Monitoring**:
- Monitors `Network.dataReceived` events
- Captures streaming SSE (Server-Sent Events) responses
- Parses chunked JSON responses
- Processes patches and delta updates
- Returns complete message with metadata

**Message Flow**:
1. User sends message via UI
2. Service types into chat input (simulates human typing)
3. Clicks send button
4. CDP captures streaming response
5. Chunks are accumulated and processed
6. Complete message returned to UI

### 3. IPC Handlers (`src/main/handlers/chat-automation.handlers.ts`)
**Purpose**: Bridge between renderer and chat automation service

**Exposed APIs**:
- `chatAutomation:init` - Initialize session
- `chatAutomation:sendMessage` - Send message and get response
- `chatAutomation:closeSession` - Close session
- `chatAutomation:getActiveSessions` - Get active session IDs

### 4. Updated Files

**Main Process**:
- `src/main/handlers/index.ts` - Registered chat automation handlers
- `src/main/preload.ts` - Exposed chat automation APIs to renderer

**Renderer Process**:
- `src/renderer/vite-env.d.ts` - Added TypeScript types for chat automation APIs
- `src/renderer/pages/automation/ChatAutomation.tsx` - Uses new chat automation service
- `src/renderer/components/automation/ChatToolbar.tsx` - Provider type updated to `"chatgpt" | "gemini"`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Renderer Process                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │  ChatAutomation.tsx                               │ │
│  │  - User selects profile & provider                │ │
│  │  - Clicks Run → init session                      │ │
│  │  - Types message → sendMessage                    │ │
│  └───────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ IPC (electronAPI.chatAutomation)
┌──────────────────────▼──────────────────────────────────┐
│                     Main Process                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  chat-automation.handlers.ts                      │ │
│  │  - Receives IPC calls                             │ │
│  │  - Delegates to ChatAutomationService             │ │
│  └────────────────────┬──────────────────────────────┘ │
│  ┌────────────────────▼──────────────────────────────┐ │
│  │  ChatAutomationService                            │ │
│  │  - Manages chat sessions                          │ │
│  │  - Uses BrowserManager to spawn Chrome            │ │
│  │  - Sets up CDP monitoring                         │ │
│  │  - Sends messages via Puppeteer                   │ │
│  │  - Processes streaming responses                  │ │
│  └────────────────────┬──────────────────────────────┘ │
│  ┌────────────────────▼──────────────────────────────┐ │
│  │  BrowserManager                                    │ │
│  │  - Spawns Chrome with debugging                   │ │
│  │  - Connects Puppeteer to debugging port           │ │
│  │  - Manages browser lifecycle                      │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                Chrome Browser Instance                   │
│  - Runs with remote debugging enabled                   │
│  - Profile-specific userDataDir                         │
│  - CDP session attached                                 │
│  - Network monitoring active                            │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Session Initialization
```typescript
// User clicks Run button
const result = await window.electronAPI.chatAutomation.init(profileId, "chatgpt");
// → Spawns Chrome with profile
// → Navigates to chat.openai.com
// → Sets up CDP monitoring
// → Returns sessionId
```

### 2. Sending Messages
```typescript
// User types message and clicks Send
const response = await window.electronAPI.chatAutomation.sendMessage(sessionId, "Hello");
// → Types into chat textarea with human-like delay
// → Clicks send button
// → CDP captures streaming response
// → Processes chunks into complete message
// → Returns { messageId, conversationId, content, timestamp }
```

### 3. CDP Monitoring (How streaming works)
```typescript
// CDP listens to Network.dataReceived events
client.on("Network.dataReceived", async (params) => {
  const response = await client.send("Network.getResponseBody", {
    requestId: params.requestId
  });
  
  // Parse SSE format: "data: {...}\n"
  const messages = response.body.split("\n");
  for (const message of messages) {
    if (message.startsWith("data: ")) {
      const data = message.slice(6);
      chunks.push(data);
      
      // When [DONE] received, process all chunks
      if (data.includes("[DONE]")) {
        const result = processMessageChunks(chunks);
        resolve(result);
      }
    }
  }
});
```

## Provider-Specific Implementation

### ChatGPT (Implemented)
- Selector: `#prompt-textarea` for input
- Send button: `[data-testid="send-button"]`
- Types message character-by-character with 20ms delay
- Monitors `/backend-api/conversation*` endpoint
- Parses SSE streaming format with patches

### Gemini (Placeholder)
- Not yet implemented
- UI selectors need to be inspected
- CDP monitoring pattern will be similar
- May require different endpoint pattern

## Testing the Feature

### 1. Prerequisites
- At least one profile created with valid browser path
- Chrome/Chromium installed

### 2. Steps
1. Navigate to Chat Automation page (sidebar → Automation → Chat Automation)
2. Select a profile from dropdown
3. Select provider (ChatGPT or Gemini)
4. Click "Run" button
   - Chrome will launch in a new window
   - Browser navigates to chat provider URL
   - Log shows: "Session {id} started (debug port: {port})"
5. Input field becomes enabled when browser is ready
6. Type a message and click Send (or press Enter)
   - Message appears in chat UI
   - Bot response streams in and appears when complete
7. Check IPC Log for detailed events

### 3. Expected Behavior
- Browser launches in visible mode (not headless)
- Chat interface loads in browser
- Typed messages appear in browser's chat input
- Responses from AI are captured and shown in app
- Multiple messages can be sent in same session

## Files Created
1. `src/services/browser-manager.ts` - Shared browser utility
2. `src/services/chat-automation/chat-automation.service.ts` - Chat automation logic
3. `src/main/handlers/chat-automation.handlers.ts` - IPC handlers

## Files Modified
1. `src/main/handlers/index.ts` - Registered new handlers
2. `src/main/preload.ts` - Exposed new APIs and types
3. `src/renderer/vite-env.d.ts` - Added TypeScript definitions
4. `src/renderer/pages/automation/ChatAutomation.tsx` - Switched to new service
5. `src/renderer/components/automation/ChatToolbar.tsx` - Updated provider type

## TypeScript Validation
- All files pass `npx tsc --noEmit -p tsconfig.json`
- No type errors

## Future Enhancements
1. **Gemini Support**: Implement Gemini-specific selectors and message sending
2. **Session Persistence**: Save/restore sessions across app restarts
3. **Multi-tab Support**: Handle multiple chat tabs in same browser
4. **Error Recovery**: Auto-reconnect on network errors
5. **Message History**: Persist conversation history to database
6. **Streaming UI**: Show message chunks as they arrive (typewriter effect)
7. **Stop Generation**: Add button to stop AI response mid-generation
8. **Context Management**: Handle conversation context and system prompts
9. **File Attachments**: Support image uploads for vision models
10. **Cost Tracking**: Monitor API usage and credit consumption

## Known Limitations
1. Gemini provider not yet implemented
2. No session persistence (sessions lost on app restart)
3. Single message at a time (no concurrent requests)
4. Requires manual login if not authenticated
5. CDP monitoring only captures HTTP responses (not WebSocket)
