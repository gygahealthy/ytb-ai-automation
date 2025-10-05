# Chat Automation — Summary

This document is a concise summary of the chat automation refactor, Gemini implementation, markdown rendering, and multi-instance automation features.

Overview
- New chat automation service that manages browser sessions (via BrowserManager), attaches CDP to capture streaming responses, and exposes IPC handlers for renderer use.
- Multi-instance orchestration: AutomationCoordinator, InstanceManager, and ScreenPositioner provide deterministic slot assignment, repositioning (CDP + native fallback), and lifecycle events.
- Gemini and ChatGPT streaming support: provider adapters parse streaming formats (SSE or Gemini length-prefixed JSON) and return final messages with conversation/message IDs.
- Markdown rendering: responses are cleaned server-side and rendered in the renderer with `react-markdown` + plugins for code highlighting and GFM support.

Key components (high level)
- BrowserManager: launches Chrome with remote debugging, retries and registers processes for CDP/native actions.
- ChatAutomationService: initSession, sendMessage (types into page and captures streaming response), closeSession, CDP monitoring.
- AutomationCoordinator / InstanceManager / ScreenPositioner: launch/stop instances, slot allocation, repositionAll(forceFullGrid), applyingPreset lock to avoid races.
- IPC handlers (main): chatAutomation and automation multi handlers to bridge renderer ↔ main services.
- Renderer: Chat UI (`ChatAutomation.tsx`, `ChatUI.tsx`) and Automation Dashboard (`InstanceDashboard.tsx`) for multi-instance control.

Usage (short)
- Start session: `chatAutomation.init(profileId, provider)` → returns sessionId and debug port.
- Send message: `chatAutomation.sendMessage(sessionId, text)` or `automation.sendMessage(instanceId, text)` for multi-instance.
- Dashboard: launch instances, drag/drop to move slots, apply presets (1x1, 1x2, 2x2, 4x4), and stop instances.

Notes & next steps
- Current chat history is stored on the running instance in memory; add DB persistence if you need history across restarts.
- Gemini parsing extracts primary candidate and IDs; extend to capture multiple candidates or multimodal content.
- Window positioning uses CDP setWindowBounds with native fallbacks (PowerShell / optional native module) — may need timing tuning for slow window creation.

Files (high-level)
- Services: `src/services/chat-automation/*`, `src/services/browser-manager.ts`, `src/services/automation/*`
- IPC: `src/main/handlers/*`
- Renderer: `src/renderer/pages/automation/*`, `src/renderer/components/automation/*`

If you'd like, I can: add DB-backed chat persistence, cap per-instance history, add a clear-history button, or push these doc changes to remote.

Architecture (visual)

Below is a compact ASCII diagram showing how the renderer, main process, services and browser interact:

```
Renderer (UI)
  ┌─────────────────────────────┐
  │ ChatAutomation.tsx / Dashboard │
  └──────────────┬──────────────┘
			  │ IPC (electronAPI)
			  ▼
		  Main Process
  ┌──────────────────────────────────────────┐
  │ IPC Handlers (chatAutomation / automation)│
  └───────┬────────────┬─────────────────────┘
		│            │
		│            │
		▼            ▼
  ChatAutomationSvc   AutomationCoordinator
	  │                    │
	  │                    └─> InstanceManager
	  │                    └─> ScreenPositioner
	  ▼
  BrowserManager
	  │
	  ▼
  Chrome Browser (remote debugging / CDP)
	  │
	  └─ CDP events (Network/WindowBounds) → ChatAutomationSvc / Coordinator
```

