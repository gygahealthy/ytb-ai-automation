/**
 * Model Selection Examples and Testing Guide
 * Shows how to use the new model selection system in your application
 */

import { GEMINI_MODEL_IDS, resolveChatModel, getChatModelHeader } from "../shared/constants/model.constants";

// ============================================================================
// EXAMPLE 1: Using Model Selection with Chat Registry Handler
// ============================================================================

/**
 * Send a message using Gemini 2.5 Pro (most capable)
 */
async function exampleUsePro(profileId: string) {
  const result = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt: "Generate a complex story with plot twists",
    model: "GEMINI_2_5_PRO", // ✅ Using constant format
    resetContext: false
  });

  console.log("Response:", result.data);
}

/**
 * Send a message using Gemini 2.5 Flash (fastest)
 */
async function exampleUseFlash(profileId: string) {
  const result = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt: "Quickly summarize this text",
    model: "GEMINI_2_5_FLASH", // ✅ Using constant format - will use ID "71c2d248d3b102ff"
    resetContext: false
  });

  console.log("Response:", result.data);
}

/**
 * Send a message using hyphenated model name
 */
async function exampleUseHyphenated(profileId: string) {
  const result = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt: "Create a poem",
    model: "gemini-2.5-pro", // ✅ Hyphenated format gets normalized automatically
    resetContext: false
  });

  console.log("Response:", result.data);
}

/**
 * Send a message using direct model ID
 */
async function exampleUseDirectId(profileId: string) {
  const result = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt: "Translate to French",
    model: "4af6c7f5da75d65d", // ✅ Direct ID for Gemini 2.5 Pro
    resetContext: false
  });

  console.log("Response:", result.data);
}

/**
 * Send a message with default model (Gemini 2.5 Pro)
 */
async function exampleUseDefault(profileId: string) {
  const result = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt: "Tell me a joke",
    // ✅ No model specified - defaults to Gemini 2.5 Pro
    resetContext: false
  });

  console.log("Response:", result.data);
}

// ============================================================================
// EXAMPLE 2: Using Model Selection with Streaming
// ============================================================================

/**
 * Stream a response using Gemini 2.5 Flash
 */
async function exampleStreamFlash(profileId: string, requestId: string) {
  const result = await electronApi.gemini.sendChatMessageStreamingWithRegistry({
    profileId,
    prompt: "Generate video script ideas",
    model: "GEMINI_2_5_FLASH", // ✅ Model passed to streaming handler
    requestId,
    resetContext: false
  });

  if (result.success) {
    console.log("Streaming started on channel:", result.channel);
    // Listen for chunks on result.channel
  }
}

// ============================================================================
// EXAMPLE 3: Using Model Selection with Non-Streaming
// ============================================================================

/**
 * Non-streaming request with specific model
 */
async function exampleNonStreaming(profileId: string) {
  const result = await electronApi.gemini.sendChatMessageNonStreaming({
    profileId,
    prompt: "What are the benefits of AI?",
    model: "GEMINI_2_5_PRO" // ✅ Model selection works here too
  });

  if (result.success) {
    console.log("Full response:", result.data);
  }
}

// ============================================================================
// EXAMPLE 4: Using Model Constants Directly
// ============================================================================

/**
 * Access model IDs and create headers manually
 */
function exampleUsingConstants() {
  // Get all available models
  console.log("Available models:");
  console.log("- Pro:", GEMINI_MODEL_IDS.GEMINI_2_5_PRO);
  console.log("- Flash:", GEMINI_MODEL_IDS.GEMINI_2_5_FLASH);
  console.log("- 2.0 Flash:", GEMINI_MODEL_IDS.GEMINI_2_0_FLASH);

  // Resolve a model to get ID and headers
  const { modelId, headers } = resolveChatModel("GEMINI_2_5_PRO");
  console.log("Model ID:", modelId);
  console.log("Headers:", headers);
  // Output:
  // Model ID: 4af6c7f5da75d65d
  // Headers: {
  //   "x-goog-ext-525001261-jspb": "[1,null,null,null,\"4af6c7f5da75d65d\",null,null,0]"
  // }

  // Get headers for a specific model
  const proHeaders = getChatModelHeader(GEMINI_MODEL_IDS.GEMINI_2_5_PRO);
  console.log("Pro model headers:", proHeaders);

  const flashHeaders = getChatModelHeader(GEMINI_MODEL_IDS.GEMINI_2_5_FLASH);
  console.log("Flash model headers:", flashHeaders);
}

// ============================================================================
// EXAMPLE 5: Comparing Model Performance
// ============================================================================

/**
 * Test different models for the same prompt
 */
async function compareModels(profileId: string) {
  const prompt = "Generate a haiku about nature";

  console.log("Testing different models with same prompt...\n");

  // Test Pro model
  console.time("Pro model");
  const proResult = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt,
    model: "GEMINI_2_5_PRO",
    resetContext: true // Start fresh conversation
  });
  console.timeEnd("Pro model");
  console.log("Pro output:", proResult.data);
  console.log("---\n");

  // Test Flash model
  console.time("Flash model");
  const flashResult = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt,
    model: "GEMINI_2_5_FLASH",
    resetContext: true // Start fresh conversation
  });
  console.timeEnd("Flash model");
  console.log("Flash output:", flashResult.data);
  console.log("---\n");
}

// ============================================================================
// EXAMPLE 6: Model Selection in Multi-Turn Conversations
// ============================================================================

/**
 * Maintain conversation with same model
 */
async function multiTurnConversation(profileId: string) {
  const model = "GEMINI_2_5_PRO"; // Use same model throughout

  // First message
  const response1 = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt: "What is machine learning?",
    model, // ✅ Pass model for first message
    resetContext: true
  });

  if (!response1.success) {
    console.error("Failed to send first message");
    return;
  }

  console.log("Response 1:", response1.data);
  console.log("Stored metadata:", response1.storedMetadata);

  // Second message - model is automatically maintained through registry
  const response2 = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt: "What are the main types of machine learning?",
    model, // ✅ Same model for follow-up
    resetContext: false // Continue conversation
  });

  console.log("Response 2:", response2.data);

  // Third message
  const response3 = await electronApi.gemini.sendChatMessageWithRegistry({
    profileId,
    prompt: "Give me examples of supervised learning",
    model, // ✅ Same model continues
    resetContext: false
  });

  console.log("Response 3:", response3.data);
}

// ============================================================================
// EXAMPLE 7: Error Handling with Model Selection
// ============================================================================

/**
 * Proper error handling when using models
 */
async function handleModelWithErrorHandling(profileId: string) {
  try {
    const result = await electronApi.gemini.sendChatMessageWithRegistry({
      profileId,
      prompt: "Hello",
      model: "GEMINI_2_5_PRO"
    });

    if (!result.success) {
      console.error("Chat failed:", result.error);
      return;
    }

    console.log("Success:", result.data);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// ============================================================================
// HEADER FORMAT REFERENCE
// ============================================================================

/**
 * Reference: How model headers look internally
 *
 * GEMINI 2.5 PRO (Chat):
 * Header: x-goog-ext-525001261-jspb
 * Value: [1,null,null,null,"4af6c7f5da75d65d",null,null,0]
 *
 * GEMINI 2.5 FLASH (Chat):
 * Header: x-goog-ext-525001261-jspb
 * Value: [1,null,null,null,"71c2d248d3b102ff",null,null,0]
 *
 * GEMINI 2.0 FLASH (Deprecated):
 * Header: x-goog-ext-525001261-jspb
 * Value: [1,null,null,null,"f299729663a2343f",null,null,0]
 *
 * For image generation, add [4] flag at the end:
 * Value: [1,null,null,null,"4af6c7f5da75d65d",null,null,0,[4]]
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Common issues and solutions:
 *
 * Q: How do I know which model was used?
 * A: Check the request logs - the model header should show the model ID
 *
 * Q: Can I switch models mid-conversation?
 * A: Yes, pass a different model in your next request. The metadata
 *    from the new model will be stored.
 *
 * Q: What's the difference between Pro and Flash?
 * A: Pro is more capable for complex reasoning. Flash is faster and
 *    cheaper for simple tasks.
 *
 * Q: Will my conversation history be lost if I switch models?
 * A: Not if you pass resetContext: false. The conversation context
 *    (chatId, replyId, rcId) will be maintained in the registry.
 *
 * Q: Do I need to specify a model?
 * A: No, it defaults to Gemini 2.5 Pro if not specified.
 */

export {
  exampleUsePro,
  exampleUseFlash,
  exampleUseHyphenated,
  exampleUseDirectId,
  exampleUseDefault,
  exampleStreamFlash,
  exampleNonStreaming,
  exampleUsingConstants,
  compareModels,
  multiTurnConversation,
  handleModelWithErrorHandling
};
