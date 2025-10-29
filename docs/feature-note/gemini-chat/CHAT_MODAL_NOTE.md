## Note: ChatModal open/close behavior

- Recommendation: if you want conversation persistence across modal open/close, do one of the following:
  Short chat mechanism (for next feature):

- ChatService registry: one ChatService per `profileId` (in-memory); stores conversation metadata (cid/rid/rcid) and is canonical for multi-turn context.
- Renderer UI: `GeminiChatContext` mirrors metadata for instant UI updates; `useGeminiChatSession` reads/writes this local state and calls `electronApi.gemini.chat.send`.
- Handlers: `sendChatMessage` routes to registry-backed or stateless handlers; persistent handlers call `chatService.loadMetadata` if client provides `conversationContext`, otherwise they use stored metadata. `resetContext` forces a server reset.
- Important: sending an explicit (even empty) `conversationContext` from the client will overwrite server metadata via `loadMetadata` — avoid sending empty values unless you intend to reset.

Files to change for next work:

- Registry: `src/main/modules/gemini-apis/services/chat.registry.ts`
- Handlers: `src/main/modules/gemini-apis/handlers/chat/*.ts` (persistent handlers)
- Renderer: `src/renderer/hooks/useGeminiChatSession.ts` and `src/renderer/components/profiles/ChatModal.tsx`

Use this note as the concise reference when adding session isolation or validation logic.

- Alternatively, persist the client metadata (e.g., local storage) and rehydrate it when reopening the modal instead of clearing it on close.

This note documents the UX tradeoff and suggests the hybrid approach (registry canonical + client transient UI state) as the preferred default.
