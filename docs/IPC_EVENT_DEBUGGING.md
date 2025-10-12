# IPC Event Debugging Guide

## Issue
Backend is broadcasting events via `win.webContents.send()`, but the client is not receiving them in VideoPromptRow or SingleVideoCreationPage.

## Investigation Steps

### 1. Backend Broadcasting (✅ Working)
The terminal logs show backend is correctly broadcasting:
```
[2] [VEO3PollingService] INFO: [Polling] Broadcasting status update to 1 window(s): {
[2]   generationId: '015443d13c32f5bea937d80e80247bc3',
[2]   promptId: '1760279912733ze306blez',
[2]   status: 'completed'
[2] }
```

**Events being broadcast:**
- `veo3:generation:status` - Video status updates (from polling service)
- `veo3:multipleVideos:progress` - Batch progress updates (from batch service)
- `veo3:batch:started` - Batch start notifications

### 2. Preload.ts Setup (✅ Configured)
The preload script exposes a generic `on` method:
```typescript
on: (channel: string, callback: (...args: any[]) => void) => {
  const listener = (_event: any, ...args: any[]) => callback(...args);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
},
```

### 3. Client Listeners (⚠️ Testing)

**VideoPromptRow.tsx:**
```typescript
useEffect(() => {
  if (!job || !job.generationId || job.status !== "processing") {
    return;
  }

  const electronAPI = (window as any).electronAPI;
  if (electronAPI?.on) {
    const unsubscribe = electronAPI.on("veo3:generation:status", handleStatusUpdate);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }
}, [job?.id, job?.generationId, job?.status, prompt.id, updateJobStatus]);
```

**SingleVideoCreationPage.tsx (NEW DEBUG LISTENER):**
Added global event listener to catch ALL events:
```typescript
useEffect(() => {
  const electronAPI = (window as any).electronAPI;
  
  const unsubStatus = electronAPI.on("veo3:generation:status", (data: any) => {
    console.log("[SingleVideoCreationPage] 📨 veo3:generation:status event received:", data);
  });

  const unsubProgress = electronAPI.on("veo3:multipleVideos:progress", (data: any) => {
    console.log("[SingleVideoCreationPage] 📨 veo3:multipleVideos:progress event received:", data);
  });

  // ...

  return () => {
    if (unsubStatus) unsubStatus();
    if (unsubProgress) unsubProgress();
  };
}, []);
```

## Testing Checklist

### Step 1: Check Browser DevTools Console
Open the application and check the browser console (F12) for:

1. **LogDrawer initialization:**
   ```
   [LogDrawer] 🔄 Setting up log subscription...
   [LogDrawer] ✅ electronAPI.logger available, subscribing...
   [LogDrawer] ✅ Log subscription active, unsubscribe function: true
   ```

2. **SingleVideoCreationPage initialization:**
   ```
   [SingleVideoCreationPage] 🔄 Setting up global event listeners for debugging...
   [SingleVideoCreationPage] ✅ electronAPI.on available, setting up listeners...
   [SingleVideoCreationPage] ✅ All event listeners registered!
   ```

3. **VideoPromptRow initialization (when job is processing):**
   ```
   [VideoPromptRow] 🔄 Effect triggered - job: <jobId> generationId: <genId> status: processing
   [VideoPromptRow] ⚡ Setting up status listener for job: ...
   [VideoPromptRow] 🔌 Checking electronAPI availability...
   [VideoPromptRow] electronAPI: true on method: true
   [VideoPromptRow] 📡 Subscribing to 'veo3:generation:status' events...
   [VideoPromptRow] ✅ Successfully subscribed! Unsubscribe function: true
   ```

### Step 2: Generate a Video
1. Add a prompt
2. Select profile and project
3. Click "Create Video"
4. Watch the console for:
   - `[SingleVideoCreationPage] 📨 veo3:multipleVideos:progress event received:` (if batch)
   - `[VideoPromptRow] 📨 Received raw status update event:`

### Step 3: Check Backend Logs
In the terminal, confirm you see:
```
[2] [VEO3PollingService] INFO: [Polling] Broadcasting status update to 1 window(s): {
```

## Possible Issues

### Issue 1: electronAPI.on returns undefined
**Symptom:** Console shows `unsubscribe function: false`
**Cause:** Preload script not loaded or out of date
**Fix:** Rebuild and restart the app

### Issue 2: Events not received even with listener active
**Symptom:** Listener registered but no `📨 Received raw status update event` logs
**Possible Causes:**
1. **Event name mismatch** - Check that backend uses `veo3:generation:status` exactly
2. **Window not found** - Backend can't find window to send to
3. **Timing issue** - Event sent before listener registered

**Debug:**
```typescript
// In main process
BrowserWindow.getAllWindows().forEach(win => {
  console.log("Sending to window:", win.id, win.webContents.id);
  win.webContents.send("veo3:generation:status", data);
});
```

### Issue 3: Handler receives event but doesn't match generationId
**Symptom:** Logs show event received but skipped
**Cause:** generationId or promptId mismatch
**Fix:** Check that the promptId is being stored correctly in the database

## Expected Flow

### Single Video Creation
1. User clicks "Create Video" → `handleCreateVideo()` called
2. Backend starts generation → Returns `{ generationId, sceneId, operationName }`
3. Client creates job with `status: "processing"` and `generationId`
4. VideoPromptRow useEffect triggers → Sets up listener for `veo3:generation:status`
5. Backend polling service checks status every 10s
6. When status changes → Backend broadcasts `veo3:generation:status` event
7. Client receives event → `handleStatusUpdate()` called
8. UI updates with progress/completion

### Batch Video Creation
1. User selects prompts and clicks "Generate Selected" → `handleCreateMultiple()` called
2. Backend receives batch request → `generateMultipleVideosAsync()` called
3. Backend immediately broadcasts `veo3:batch:started` event
4. Backend processes prompts in background with delays
5. For each prompt:
   - Backend creates video
   - Backend broadcasts `veo3:multipleVideos:progress` event with `{ promptId, generationId }`
   - Backend adds generationId to polling queue
6. Client receives progress events → Updates job status to "processing"
7. VideoPromptRow picks up processing status → Sets up polling listener
8. Backend polling service checks all generations every 10s
9. When complete → Backend broadcasts `veo3:generation:status` event
10. Client updates to completed

## Files Modified

### Enhanced Logging Added:
- ✅ `src/renderer/components/video-creation/VideoPromptRow.tsx` - Added detailed console logs for event subscription
- ✅ `src/renderer/pages/video-creation/SingleVideoCreationPage.tsx` - Added global event listener for debugging
- ✅ `src/renderer/components/LogDrawer.tsx` - Enhanced log subscription logs

### Backend Files (Already Working):
- ✅ `src/main/modules/ai-video-creation/services/veo3/veo3-polling.service.ts` - Broadcasts `veo3:generation:status`
- ✅ `src/main/modules/ai-video-creation/services/veo3/veo3-batch-generation.service.ts` - Broadcasts `veo3:multipleVideos:progress` and `veo3:batch:started`

## Next Steps
1. **Run the app**: `npm run dev`
2. **Open DevTools Console**: F12
3. **Check initialization logs**: Look for ✅ symbols
4. **Generate a video**: Test single video creation
5. **Watch for events**: Look for 📨 event received logs
6. **Report findings**: If events NOT received, we have a deeper IPC issue
