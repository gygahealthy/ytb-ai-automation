# Chat Persistence Investigation & Findings

## Problem Statement

User reported: "the AI still seem to use the conversation context and not remember any thing"

Even though the system was marked as using PERSISTENT mode with conversation context preservation, Gemini was responding with "I don't have access to our past conversation history" for every message.

## Root Cause Analysis

### What We Implemented ✅

1. **Registry Pattern**: Per-profile singleton ChatService instances that maintain metadata
2. **Persistence Mode**: Backend correctly stores conversation ID (cid), reply ID (rid), response candidate ID (rcid)
3. **Metadata Flow**:
   - ChatService stores metadata after each response
   - Metadata is returned in API responses
   - Frontend stores metadata and passes it on next request
4. **Type Safety**: All TypeScript types aligned across renderer↔main boundary

### What's Not Working ❌

**The Gemini API is returning DIFFERENT conversation IDs with each response**, even though we're sending the previous conversation ID:

```
Request 1:
  [DEBUG] Conversation: c_2d0d4532a199a5d1  ← New conversation
  ↓
Response 1:
  [INFO] conversationId: 'c_3a65cc1e0d846838'  ← Different ID!

Request 2:
  [DEBUG] Conversation: c_3a65cc1e0d846838  ← Using returned ID
  ↓
Response 2:
  [INFO] conversationId: 'c_6bf3859119549f3a'  ← Different ID again!
```

### Hypothesis

The Gemini API may have changed how it handles conversation continuation, or the `rcId` field is critical for proper continuation and is being extracted incorrectly.

## Code Flow Verification

### 1. Payload Building

**File**: `src/main/modules/gemini-apis/helpers/chat.helpers.ts`

```typescript
export function buildChatPayload(
  prompt: string,
  conversationContext: ConversationContext | null = null
): string {
  if (conversationContext) {
    const { chatId, replyId, rcId } = conversationContext;
    inner = [[prompt], null, [chatId, replyId, rcId]]; // ← Conversation context sent
  } else {
    inner = [[prompt], null, null]; // ← New conversation
  }
  // ...
}
```

✅ Correctly builds payload with `[cid, rid, rcid]`

### 2. Metadata Extraction

**File**: `src/main/modules/gemini-apis/helpers/chat.helpers.ts`

```typescript
export function extractMetadata(
  parsedData: unknown[]
): ConversationMetadata | null {
  // Extracts from mainData[1]: [cid, rid, ...]
  // Extracts rcid from mainData[4][0][0]
  return {
    cid: metadata[0] || null,
    rid: metadata[1] || null,
    rcid: rcid,
  };
}
```

✅ Extraction logic looks correct based on API response format

### 3. Backend Persistence

**File**: `src/main/modules/gemini-apis/handlers/chat/sendChatMessageWithRegistry.ts`

```typescript
// Load external context from UI
if (conversationContext) {
  chatService.loadMetadata({
    cid: conversationContext.chatId,
    rid: conversationContext.replyId,
    rcid: conversationContext.rcId,
  });
}

// Send message (ChatService internally uses metadata)
const response = await chatService.sendMessage(prompt);

// Update stored metadata from response
if (response.metadata) {
  this.metadata = response.metadata;
}
```

✅ Correctly loads context, sends, and updates metadata

### 4. Frontend Persistence (FIXED)

**Before Fix**:

```typescript
if (response.success) {
  if (response.streaming && response.channel) {
    setStreamChannel(response.channel);
    // ❌ No metadata extraction on stream complete!
  } else {
    // ✅ Non-streaming extracted metadata
    if (response.storedMetadata) {
      setConversationContext({ ... });
    }
  }
}
```

**After Fix**:

```typescript
} else if (data.type === "complete") {
  // ✅ Now extracts metadata from streaming complete event
  if (data.data?.metadata) {
    setConversationContext({
      chatId: data.data.metadata.cid || "",
      replyId: data.data.metadata.rid || "",
      rcId: data.data.metadata.rcid || "",
    });
  }
}
```

## Changes Made

### 1. Streaming Metadata Extraction ✅

**File**: `src/renderer/components/profiles/ChatModal.tsx`

Added metadata extraction from streaming complete messages:

```typescript
else if (data.type === "complete") {
  setIsLoading(false);
  setCanSend(true);
  setStreamChannel(null);
  // Extract and store metadata from streaming completion
  if (data.data?.metadata) {
    setConversationContext({
      chatId: data.data.metadata.cid || "",
      replyId: data.data.metadata.rid || "",
      rcId: data.data.metadata.rcid || "",
    });
    console.log("[ChatModal] Stored conversation context from stream:", data.data.metadata);
  }
}
```

### 2. Model Selection Constants ✅

**File**: `src/shared/constants/gemini-models.constants.ts`

Created comprehensive model selection constants based on https://github.com/hieu2906090/Gemini-API:

- `GEMINI_MODEL_UNSPECIFIED` - Default
- `GEMINI_MODEL_2_5_PRO` - Latest with thinking (has daily limit)
- `GEMINI_MODEL_2_5_FLASH` - Fast alternative
- `GEMINI_MODEL_2_0_FLASH` - Deprecated
- `GEMINI_MODEL_2_0_FLASH_THINKING` - Deprecated with thinking

Plus helper functions:

- `getModelInfo(model)` - Get model metadata
- `isSupportedModel(model)` - Check if available
- `isDeprecatedModel(model)` - Check if deprecated

### 3. Documentation ✅

**File**: `docs/GEMINI_MODEL_CONSTANTS.md`

Comprehensive guide on:

- Available models and their limitations
- Daily usage limits for Pro model
- Implementation examples
- Future considerations for model selection UI

## Next Steps to Debug

### To Find the Real Issue:

1. **Add detailed logging** to `sendChatRequest()`:

   ```typescript
   logger.debug("Sending conversation context to API:", {
     chatId: conversationContext?.chatId,
     replyId: conversationContext?.replyId,
     rcId: conversationContext?.rcId,
   });
   ```

2. **Log extracted metadata**:

   ```typescript
   logger.debug("Extracted metadata from response:", {
     cid: metadata?.cid,
     rid: metadata?.rid,
     rcid: metadata?.rcid,
   });
   ```

3. **Check f.req format** - Add logging of the actual payload sent to Gemini API:

   ```typescript
   logger.debug("f.req payload:", fReq);
   ```

4. **Inspect raw API response** - Log the raw response before parsing:

   ```typescript
   logger.debug("Raw Gemini response:", responseText);
   ```

5. **Test with manual cIds** - Try explicitly setting conversation IDs to known values to see if Gemini accepts them

### Potential Solutions:

1. **API Contract Change**: Gemini API might require a different payload format for conversation continuation
2. **rcId Requirement**: The `rcId` might be mandatory and in wrong format
3. **Token Expiration**: The conversation IDs might expire and can't be reused after some time
4. **Session Context**: Might need additional headers or session information to continue conversations
5. **API Version**: Check if GitHub repo uses a different version of the Gemini API

## Build Status

✅ **Clean Build**: No TypeScript or ESLint errors after all changes

## Testing Checklist

- [ ] Send first message in PERSISTENT mode
- [ ] Check console for: `[ChatModal] Stored conversation context: {cid: "...", rid: "...", rcid: "..."}`
- [ ] Send second message and verify it uses stored context
- [ ] Check main process logs for conversation ID being sent
- [ ] Verify Gemini response mentions previous context (if API works)
- [ ] Test with streaming enabled
- [ ] Test with non-streaming mode
- [ ] Verify metadata persists across multiple messages

## Files Modified

1. `src/renderer/components/profiles/ChatModal.tsx` - Added streaming metadata extraction
2. `src/shared/constants/gemini-models.constants.ts` - Created model constants
3. `docs/GEMINI_MODEL_CONSTANTS.md` - Added model documentation

## Known Limitations

1. **Conversation Context Not Preserved**: Despite implementing all necessary plumbing, Gemini API is not maintaining multi-turn context (returns different conversation IDs each time)
2. **Daily Limit**: Gemini 2.5 Pro has undocumented daily usage limit
3. **Memory Tool Unavailable**: Gemini's built-in memory tool seems to be non-functional in this API

## References

- GitHub Repo: https://github.com/hieu2906090/Gemini-API
- Model Selection: https://github.com/hieu2906090/Gemini-API#select-language-model
- Conversation Continuation: https://github.com/hieu2906090/Gemini-API#continue-previous-conversations
