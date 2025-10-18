import { useCallback, useEffect } from "react";
import { useGeminiChat } from "../contexts/GeminiChatContext";
import electronApi from "../ipc";
import { GEMINI_CHAT_NORMAL_MODE_PERSISTENT } from "../../shared/constants/gemini-chat.constants";
import { GEMINI_MODEL_UNSPECIFIED } from "../../shared/constants/gemini-models.constants";

/**
 * Hook for managing Gemini chat conversations with context preservation
 * Handles:
 * - Conversation metadata persistence (chatId, replyId, rcId)
 * - Multi-turn chat context
 * - Model selection
 * - Error handling
 *
 * Usage in ChatModal:
 * ```tsx
 * const chat = useGeminiChatSession(profileId);
 *
 * const response = await chat.sendMessage(prompt);
 * chat.resetConversation();
 * ```
 */
export function useGeminiChatSession(profileId: string | null) {
  const {
    conversationMetadata,
    selectedModel,
    isLoading,
    error,
    updateConversationMetadata,
    clearConversationMetadata,
    setSelectedModel,
    setIsLoading,
    setError,
  } = useGeminiChat();

  /**
   * Send a message and preserve conversation context
   */
  const sendMessage = useCallback(
    async (
      prompt: string,
      options: {
        stream?: boolean;
        model?: string;
      } = {}
    ) => {
      if (!profileId || !prompt.trim()) {
        setError("Profile ID or prompt is missing");
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await electronApi.gemini.chat.send({
          profileId,
          prompt: prompt.trim(),
          stream: options.stream ?? false,
          requestId: options.stream
            ? `${Date.now()}-${Math.random().toString(36).substring(7)}`
            : undefined,
          mode: GEMINI_CHAT_NORMAL_MODE_PERSISTENT,
          model: options.model || selectedModel,
          conversationContext: {
            chatId: conversationMetadata.chatId || "",
            replyId: conversationMetadata.replyId || "",
            rcId: conversationMetadata.rcId || "",
          },
        });

        if (!response.success) {
          setError(response.error || "Failed to send message");
          setIsLoading(false);
          return null;
        }

        // Update conversation metadata from response for next request
        if (response.storedMetadata) {
          updateConversationMetadata({
            chatId: response.storedMetadata.cid || null,
            replyId: response.storedMetadata.rid || null,
            rcId: response.storedMetadata.rcid || null,
          });

          console.log(
            "[useGeminiChatSession] Updated conversation context:",
            response.storedMetadata
          );
        }

        if (!response.streaming) {
          setIsLoading(false);
        }

        return response;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(message);
        setIsLoading(false);
        console.error("[useGeminiChatSession] Error:", err);
        return null;
      }
    },
    [
      profileId,
      conversationMetadata,
      selectedModel,
      setIsLoading,
      setError,
      updateConversationMetadata,
    ]
  );

  /**
   * Handle streaming completion event
   * Extract metadata from stream complete message
   */
  const handleStreamComplete = useCallback(
    (completeData: any) => {
      if (completeData?.metadata) {
        updateConversationMetadata({
          chatId: completeData.metadata.cid || null,
          replyId: completeData.metadata.rid || null,
          rcId: completeData.metadata.rcid || null,
        });

        console.log(
          "[useGeminiChatSession] Stream complete, updated context:",
          completeData.metadata
        );
      }

      setIsLoading(false);
    },
    [updateConversationMetadata, setIsLoading]
  );

  /**
   * Reset conversation (start new chat)
   */
  const resetConversation = useCallback(() => {
    clearConversationMetadata();
    console.log("[useGeminiChatSession] Conversation reset");
  }, [clearConversationMetadata]);

  /**
   * Change model for next request
   */
  const changeModel = useCallback(
    (model: string) => {
      setSelectedModel(model);
      console.log("[useGeminiChatSession] Model changed to:", model);
    },
    [setSelectedModel]
  );

  /**
   * Get current conversation context
   */
  const getContext = useCallback(() => {
    return {
      chatId: conversationMetadata.chatId,
      replyId: conversationMetadata.replyId,
      rcId: conversationMetadata.rcId,
      model: selectedModel,
      hasContext:
        conversationMetadata.chatId !== null &&
        conversationMetadata.replyId !== null,
    };
  }, [conversationMetadata, selectedModel]);

  return {
    // State
    conversationMetadata,
    selectedModel,
    isLoading,
    error,

    // Methods
    sendMessage,
    handleStreamComplete,
    resetConversation,
    changeModel,
    getContext,
  };
}

/**
 * Hook for model selection with constants
 */
export function useModelSelection(
  defaultModel: string = GEMINI_MODEL_UNSPECIFIED
) {
  const { selectedModel, setSelectedModel } = useGeminiChat();

  useEffect(() => {
    if (!selectedModel || selectedModel === "unspecified") {
      setSelectedModel(defaultModel);
    }
  }, [defaultModel, selectedModel, setSelectedModel]);

  return {
    selectedModel,
    setSelectedModel,
  };
}
