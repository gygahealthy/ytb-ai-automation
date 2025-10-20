# Session-per-Profile: Current behavior and multi-session solution

This short note explains the current per-profile chat handling and proposes a pragmatic implementation to support multiple simultaneous chat sessions per profile (for example: per-component sessions or multiple UI chat windows).

## 1) Current behavior (per-profile singleton)

- The registry (see `chat.registry`) stores one `ChatService` instance per `profileId`.
- `ChatService` keeps an in-memory `metadata` object (cid/rid/rcid) representing the current conversation state for that profile.
- On send:
  - The registry/ChatService seeds the outbound request with its `metadata`.
  - After the request completes, `ChatService` replaces its `metadata` with the server-returned metadata (authoritative).
- Consequence:
  - Only one logical session is guaranteed per `profileId`.
  - Concurrent independent sessions for the same profile will race and overwrite the shared metadata.
  - The UI (renderer) mirrors metadata in `GeminiChatContext` for instant updates but it must sync with main responses.

## 2) Problem: two concurrent sessions for same profile

- If two different features (e.g., ComponentA and ComponentB) each want a persistent conversation for the same profile, they will collide:
  - Both use the same ChatService and metadata, so responses from one session can overwrite the other's metadata.
  - Leads to confusion, lost context, and incorrect follow-ups.

## 3) Recommended solution (per-session ChatService keyed by sessionKey)

Goal: allow multiple isolated sessions per profile while preserving current behavior when sessionKey is omitted.

Design summary:

- Key the registry by composite key: `${profileId}:${sessionKey || 'default'}`.
- sessionKey examples:
  - componentName (for component-level prompts)
  - a UI-generated session id (for separate chat windows)
  - omitted/null -> falls back to default shared session (backward compatible)

Implementation steps (high level):

1. Update `chat.registry`:

   - Change `chatServices` map keys to composite key and expose `getOrCreateChatService(profileId, cookieManager, sessionKey?)`.
   - Keep `resetChatService(profileId, sessionKey?)` and `resetCookieManager(profileId)` behaviours backward compatible.

2. Update handlers that create/lookup services:

   - `sendChatMessageWithRegistry` and streaming equivalent should accept optional `sessionKey` and pass it to registry when fetching the service.
   - If a caller doesn't specify sessionKey, use `'default'` to preserve current behaviour.

3. Update callers where isolation is desired:

   - `ai-prompt.service` should call registry with `sessionKey = componentName` (so component prompts each get isolated sessions).
   - ChatModal (single UI chat) can continue using `sessionKey = 'default'` or generate a session id for each chat window if separate sessions are wanted.

4. Optional: persist per-session metadata (DB)

   - If you want sessions to survive restarts, create a small sessions table keyed by `(profileId, sessionKey)` and persist the storedMetadata after each response.
   - On ChatService creation, rehydrate metadata from DB if present.

5. Optional: per-session send queue
   - To avoid races inside a session, keep per-session serialization (queue) so messages for the same session are executed sequentially.

API examples

- Registry lookup (pseudo):

```ts
// getOrCreateChatService now accepts sessionKey
const service = getOrCreateChatService(profileId, cookieManager, sessionKey);
await service.sendMessage(prompt, options);
```

- ai-prompt.service usage (pseudo):

```ts
// isolate by component name
const sessionKey = `component:${componentName}`;
const service = getOrCreateChatService(profileId, cookieManager, sessionKey);
const resp = await service.sendMessage(processedPrompt, options);
```

Backward compatibility

- If sessionKey is not provided, behaviour is unchanged. The existing single-session-per-profile semantics remain.

Why this approach

- Simple, minimal change to registry and callers.
- Explicit session keys make intent clear and isolate metadata naturally.
- Easy to persist per-session state and to add per-session queuing.

Alternatives (not recommended unless you need complex multiplexing)

- Keep single ChatService but manage multiple logical metadata slots inside it (complex, error-prone)
- Always use stateless `sendRequestOnce` for parallel calls (loses continuity)

## 4) Tasks to implement (estimate)

- Change registry keying and API: small (1-2 files)
- Update handlers that acquire services: small (2-3 files)
- Update ai-prompt.service to pass sessionKey: tiny (1 file)
- Add DB session table and migrations: small-medium (if needed)
- Add per-session queue: small (optional)

If you'd like I can implement the registry composite-key change + handler updates and update `ai-prompt.service` to use componentName as sessionKey. I'll run type checks and provide the diffs. Reply with "implement sessionKey approach" and I'll start.

**_ End of note _**

## Important operational note: loadMetadata and empty client context

- The handlers call `chatService.loadMetadata(...)` when a `conversationContext` is supplied by the client. That call overwrites the server-side stored metadata for the ChatService instance.
- If a client accidentally sends an empty or partial `conversationContext` (for example `{ chatId: "", replyId: "" }` or undefined fields), it can unintentionally clear or corrupt the registry metadata and cause the next request to start a new conversation.
- Recommendation:
  - Do not send empty/partial `conversationContext` from the renderer. Only send `conversationContext` when you intend to restore or override session state.
  - Prefer using `resetContext: true` or a dedicated `resetSession` IPC to intentionally clear a session.
  - Defensively validate incoming `conversationContext` in the handlers (require all three fields non-empty) before calling `loadMetadata`.

Example handler guard (pseudo):

```ts
const isValid =
  conversationContext &&
  conversationContext.chatId &&
  conversationContext.replyId &&
  conversationContext.rcId;
if (isValid) {
  chatService.loadMetadata({
    cid: conversationContext.chatId,
    rid: conversationContext.replyId,
    rcid: conversationContext.rcId,
  });
} else if (conversationContext) {
  logger.warn(
    "[chat] Ignoring invalid/partial conversationContext from client",
    { conversationContext }
  );
}
```

This simple guard prevents accidental metadata wipes and reduces race conditions when multiple UI sessions exist for the same profile.

## Short assessment

- Practicality: Allowing the client to supply `conversationContext` and letting `loadMetadata` apply it is convenient. It enables quick session restore and keeps UI-driven workflows simple without extra IPC.
- Risks: The approach is brittle because partial/empty contexts or accidental clears from the renderer can overwrite server-side metadata, causing unexpected new sessions or lost history. It also magnifies race conditions when multiple renderer contexts share the same `profileId`.
- Immediate mitigations (low friction):
  - Add a handler-side guard to only `loadMetadata` when the provided `conversationContext` has all three fields non-empty.
  - On the renderer, only send `conversationContext` when `hasContext` is true (or when explicitly restoring).
  - Use `resetContext: true` or a dedicated `resetSession` IPC for intentional resets.
- Longer-term improvements:
  - Implement `sessionKey` composite-key support in the registry to allow isolated sessions per component or window.
  - Optionally persist per-session metadata to DB if sessions must survive restarts.

Overall: Keep the convenience but add defensive validation server-side and conservative client usage. That gives the best balance between developer ergonomics and safety.
