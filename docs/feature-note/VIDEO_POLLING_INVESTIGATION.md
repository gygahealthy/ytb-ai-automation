# Video Polling Investigation

Date: 2025-10-27
Author: automated investigation

This note documents an investigation of how video generation status polling is implemented across the renderer and main processes for the VEO3 Flow integration. It summarizes where polling is started, how the renderer receives updates, and recommended next steps. No code was changed during this investigation.

## Goal

- Confirm whether the frontend (VideoPromptRow / VideoHistoryPage) triggers polling.
- Confirm whether backend automatically starts polling Flow for new generations when a single video is started.
- Identify exact files and call sites and recommend minimal changes if automatic polling is desired for single-generation flow.

## Files inspected

- Renderer

  - `src/renderer/pages/video-creation/SingleVideoCreationPage.tsx` (listeners, start generation flows)
  - `src/renderer/contexts/VideoHistoryContext.tsx` (history fetching and manual refresh)
  - `src/renderer/components/video-creation/single-video-page/VideoPromptRow.tsx` (UI progress behavior)
  - `src/renderer/pages/video-creation/VideoHistoryPage.tsx` (provider wrapper)

- Main / Backend
  - `src/main/modules/ai-video-creation/flow-veo3-apis/services/veo3-apis/veo3-video-creation.service.ts` (single start flow)
  - `src/main/modules/ai-video-creation/flow-veo3-apis/services/veo3-apis/veo3-batch-generation.service.ts` (batch flow)
  - `src/main/modules/ai-video-creation/flow-veo3-apis/services/veo3-apis/veo3-polling.service.ts` (background polling)
  - `src/main/main.ts` (startup: `restorePendingGenerations()`)

## Key findings

1. Renderer subscription

   - The renderer registers listeners for backend broadcasts in `SingleVideoCreationPage.tsx`:
     - `veo3:generation:status` — main broadcast channel from `veo3-polling.service`.
     - `veo3:multipleVideos:progress` — used by batch flow to notify the UI when a generation starts.
   - `VideoPromptRow.tsx` does not call the backend status-check API on an interval. Instead it:
     - Displays a local "fake" progress animation when the job is `processing`.
     - Relies on the job store being updated by the event listeners for authoritative status updates.
   - `VideoHistoryContext` provides `handleRefreshStatus` for a manual single-shot refresh that calls `veo3IPC.refreshVideoStatus(operationName, generationId)`.

2. Backend polling behavior

   - `veo3-video-creation.service.startVideoGeneration` (single-start path):
     - Calls the external API to start generation and inserts a `videoGeneration` DB row with `status: "pending"`.
     - Returns `generationId`/`sceneId`/`operationName` to the caller.
     - Does NOT call `veo3PollingService.addToPolling(...)` after creating the generation.
   - `veo3-batch-generation.service` (batch path):
     - For each generated video (during async batch processing) it calls `veo3PollingService.addToPolling(generationId, promptId)` immediately after the generation starts.
     - Also broadcasts `veo3:multipleVideos:progress` to inform renderers of generation starts.
   - `veo3-polling.service`:
     - Periodically (10s) checks queued generation IDs via `veo3StatusCheckerService.checkGenerationStatus(...)`.
     - Broadcasts `veo3:generation:status` events to all windows with status/progress/completion info.
     - On app startup, `restorePendingGenerations()` reads DB and enqueues any `pending` or `processing` generations.

3. Behavioral consequence
   - When a single video is started via `startVideoGeneration`, the backend does not immediately begin polling that generation. Therefore the renderer will only see automatic status updates if:
     - The generation was created as part of a batch (batch enqueues polling), or
     - The app is restarted (startup restore enqueues pending items), or
     - A user or renderer triggers a manual `refreshVideoStatus` call.
   - Meanwhile, `VideoPromptRow` shows fake progress while waiting.

## Recommended minimal changes (developer decision required)

Choose one of the following approaches depending on desired UX and server load preferences:

Option A — Backend enqueue on single-start (recommended)

- After creating the generation record in `veo3-video-creation.service.ts`, call `veo3PollingService.addToPolling(generationId /*, optional promptId */)`.
- Optionally broadcast an IPC event (e.g., `veo3:multipleVideos:progress` or a new `veo3:singleVideo:started`) so renderers immediately know a generation was enqueued and can expect `veo3:generation:status` updates.
- Pros: single authoritative polling approach, renderer receives updates via the existing broadcast mechanism, minimal change.
- Cons: Adds immediate polling load on the backend; acceptable if volume is low or rate-limited appropriately.

Option B — Renderer-driven polling (no backend change)

- After receiving `generationId` from `startVideoGeneration`, the renderer calls `veo3IPC.refreshVideoStatus(operationName, generationId)` once after a short delay and/or periodically until completion.
- Pros: No backend changes required.
- Cons: Multiple clients can increase calls to Flow API; less centralized and less efficient.

Option C — Hybrid

- Enqueue on single-start but use a delayed enqueue (e.g., start polling after N seconds), or enqueue with lower priority/longer poll interval. This reduces immediate load but still centralizes polling.

## Suggested implementation (Option A example)

In `veo3-video-creation.service.ts` after the DB create call complete:

```ts
// pseudo-code (conceptual)
await videoGenerationRepository.create({...});
// Enqueue for backend polling immediately
veo3PollingService.addToPolling(generationId, /* promptId if available */);
// Optionally broadcast start event
const windows = BrowserWindow.getAllWindows();
windows.forEach(w => { if (!w.isDestroyed()) w.webContents.send('veo3:multipleVideos:progress', { promptId: null, success: true, generationId, sceneId: ..., index: 1, total: 1 }); });
```

Note: The code above is illustrative; adapt to existing code patterns (import `veo3PollingService` from the same module used by batch service, and reuse the same broadcast helper if present).

## Next steps I can take (pick one)

- Draft a safe patch that implements Option A (one-line enqueue + optional broadcast) and run local TypeScript build checks. I will NOT commit without your approval.
- Draft a renderer-side change to call `refreshVideoStatus` shortly after starting a single generation (safe, no backend changes), and run checks.
- Leave as-is — rely on batch path or restart/manual refresh for status updates.

Tell me which next step you want, and I will prepare the patch (or provide the exact diff) and run quick build/TS checks.

---

Investigation done. No code was modified in the repo during this process.
