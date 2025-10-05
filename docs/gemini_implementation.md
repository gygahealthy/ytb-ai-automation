# Gemini Chat Automation Implementation

## Overview
Implemented full Gemini support for the chat automation service, including input handling, send button detection, and streaming response parsing.

## Changes Made

### 1. Gemini Input Handling (`sendGeminiMessage`)

**Selector**: `rich-textarea .ql-editor`

The Gemini UI uses a rich text editor with the following structure:
```html
<rich-textarea>
  <div class="ql-editor textarea new-input-ui" contenteditable="true">
    <p><br></p>
  </div>
</rich-textarea>
```

**Implementation**:
```typescript
private async sendGeminiMessage(page: Page, message: string): Promise<void> {
  // 1. Wait for editor
  await page.waitForSelector('rich-textarea .ql-editor', { timeout: 5000 });
  
  // 2. Focus editor
  await page.click('rich-textarea .ql-editor');
  await this.safeWait(page, 500);

  // 3. Clear existing content
  await page.evaluate(() => {
    const editor = document.querySelector('rich-textarea .ql-editor');
    if (editor) {
      (editor as HTMLElement).innerHTML = '<p><br></p>';
    }
  });

  // 4. Type message with human-like delay
  for (const char of message) {
    await page.type('rich-textarea .ql-editor', char, { delay: 20 });
  }

  // 5. Click send button
  await page.waitForSelector('button.send-button', { timeout: 5000 });
  await page.click('button.send-button');
}
```

### 2. Send Button Detection

**Selector**: `button.send-button`

The send button appears after typing and has the following structure:
```html
<button class="mdc-icon-button mat-mdc-icon-button send-button">
  <mat-icon fonticon="send">send</mat-icon>
</button>
```

### 3. CDP Monitoring for Gemini

**Endpoint**: `https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate`

Updated `setupCDPMonitoring` to handle both ChatGPT and Gemini formats:

**ChatGPT**: SSE format with `data: ` prefix
**Gemini**: Length-prefixed JSON format

```typescript
if (provider === "gemini") {
  // Split by newlines and parse each chunk
  const lines = response.body.split("\n").filter((line: string) => line.trim());

  for (const line of lines) {
    // Skip length prefixes (numbers) and special markers
    if (/^\d+$/.test(line) || line === ")]}'" || line === "'" || line === "]") {
      continue;
    }
    chunks.push(line);
  }

  // Check if response is complete
  if (response.body.includes('"af.httprm"') || response.body.includes('"e",31')) {
    const result = this.processMessageChunks(chunks, provider);
    // Resolve promise...
  }
}
```

### 4. Gemini Response Format Parsing

The Gemini streaming response has a unique format:

**Structure**:
```
)
]
}'
<length>
[["wrb.fr", null, "[JSON_STRING]"]]
<length>
[["wrb.fr", null, "[JSON_STRING]"]]
...
```

**Response Completion Markers**:
- `"af.httprm"` - HTTP request marker
- `"e",31` - End event marker

**Message Extraction**:

The actual message content is deeply nested:
```json
[
  [
    "wrb.fr",
    null,
    "[null,[\"c_7c490e6ec7927dcf\",\"r_826225cd1a5930b8\"],null,null,[[\"rc_f529a954bcbe17d8\",[\"Hello there! How can I help you today?\"],...]]...]"
  ]
]
```

**Parsing Logic**:
```typescript
if (provider === "gemini") {
  for (const chunk of chunks) {
    const data = JSON.parse(chunk);
    
    if (Array.isArray(data)) {
      for (const item of data) {
        if (Array.isArray(item) && item[0] === "wrb.fr" && item[2]) {
          // Parse inner JSON string
          const innerData = JSON.parse(item[2]);
          
          // Extract conversation ID and message ID
          if (Array.isArray(innerData) && innerData[1]) {
            conversationId = innerData[1][0] || "";
            messageId = innerData[1][1] || "";
          }

          // Extract message content from rc_* response
          if (Array.isArray(innerData) && innerData[4]) {
            const responseArray = innerData[4];
            if (Array.isArray(responseArray) && responseArray[0]) {
              const rcData = responseArray[0];
              if (Array.isArray(rcData) && rcData[1]) {
                fullMessage = rcData[1][0];
              }
            }
          }
        }
      }
    }
  }
}
```

## Response Format Breakdown

### Gemini Streaming Response Structure

Each chunk in the stream follows this pattern:

1. **Length Prefix**: Number indicating the byte length of the following JSON
   ```
   676
   ```

2. **Wrapped Response**: Array containing metadata and data
   ```json
   [["wrb.fr", null, "[INNER_JSON_STRING]"]]
   ```

3. **Inner Data Structure** (parsed from string):
   ```json
   [
     null,
     ["c_7c490e6ec7927dcf", "r_826225cd1a5930b8"],  // [conversationId, responseId]
     null,
     null,
     [
       [
         "rc_f529a954bcbe17d8",
         ["Hello there! How can I help you today?"],  // Message content
         ...
       ]
     ],
     ...
   ]
   ```

### Key Fields

- **`innerData[1][0]`**: Conversation ID (e.g., `"c_7c490e6ec7927dcf"`)
- **`innerData[1][1]`**: Response/Message ID (e.g., `"r_826225cd1a5930b8"`)
- **`innerData[4][0][1][0]`**: Actual message text

### Stream Completion

The stream ends with control messages:
```json
[["di", 4898], ["af.httprm", 4897, "-2023687940169640315", 65]]
[["e", 31, null, null, 32079]]
```

## Usage Example

```typescript
// Initialize session
const result = await chatAutomationService.initSession(profileId, "gemini");
const { sessionId } = result.data;

// Send message
const response = await chatAutomationService.sendMessage(sessionId, "Hello");

console.log(response.data.content); // "Hello there! How can I help you today?"
console.log(response.data.conversationId); // "c_7c490e6ec7927dcf"
console.log(response.data.messageId); // "r_826225cd1a5930b8"
```

## Testing

### Manual Testing Steps

1. Select a profile with valid browser path
2. Choose "Gemini" from provider dropdown
3. Click "Run" button
   - Browser opens and navigates to https://gemini.google.com/app
   - CDP monitoring starts
4. Type a message in the app UI
5. Click Send or press Enter
6. Watch the bot response appear in the chat

### Expected Behavior

- Input field is detected and focused
- Message is typed character-by-character
- Send button appears and is clicked
- Response is captured from streaming endpoint
- Full message text is extracted and displayed
- Conversation ID and message ID are captured

## Differences from ChatGPT

| Feature | ChatGPT | Gemini |
|---------|---------|--------|
| **Input Selector** | `#prompt-textarea` | `rich-textarea .ql-editor` |
| **Send Button** | `[data-testid="send-button"]` | `button.send-button` |
| **Response Format** | SSE with `data:` prefix | Length-prefixed JSON |
| **Endpoint** | `/backend-api/conversation` | `BardFrontendService/StreamGenerate` |
| **Message Path** | `data.v.message.content.parts[0]` | `innerData[4][0][1][0]` |
| **Completion Marker** | `[DONE]` | `"af.httprm"` or `"e",31` |

## Known Limitations

1. **Response Parsing**: Only extracts the first message text from `rcData[1][0]`. Gemini can return multiple response candidates, but we only capture the first one.

2. **Thinking Process**: The example response shows Gemini includes "thinking process" text (e.g., "**Interpreting User Input**"). This is currently included in the message content. Could be filtered if needed.

3. **Multimodal Content**: Current implementation assumes text-only responses. Image or file responses are not handled.

4. **Error Handling**: No specific error handling for Gemini API errors (e.g., rate limits, content policy violations).

## Future Enhancements

1. **Multiple Candidates**: Parse and return all response candidates from Gemini
2. **Thinking Process Filter**: Option to exclude or separately return the thinking process
3. **Multimodal Support**: Handle image uploads and image responses
4. **Token Usage**: Extract and report token usage from response metadata
5. **Safety Ratings**: Parse and log safety ratings from Gemini responses
6. **Conversation History**: Store and retrieve full conversation history
7. **Draft Editing**: Support editing and regenerating responses

## Files Modified

- `src/services/chat-automation/chat-automation.service.ts`
  - `setupCDPMonitoring()` - Added Gemini format handling
  - `sendGeminiMessage()` - Implemented input and send logic
  - `processMessageChunks()` - Added Gemini response parsing

## Validation

- ✅ TypeScript check passes (`npx tsc --noEmit`)
- ✅ Input selectors match Gemini UI structure
- ✅ Send button selector works
- ✅ CDP monitoring captures streaming responses
- ✅ Response parsing extracts message content correctly
- ✅ Conversation and message IDs are captured
