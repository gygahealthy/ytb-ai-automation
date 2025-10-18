import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { GEMINI_MODEL_2_5_PRO } from "../../shared/constants/gemini-models.constants";

/**
 * Conversation Metadata - stores IDs needed for multi-turn context
 */
export interface ConversationMetadata {
  chatId: string | null;
  replyId: string | null;
  rcId: string | null;
}

/**
 * Gemini Chat State - manages conversation context and history per profile
 */
export interface GeminiChatState {
  // Conversation metadata for context preservation
  conversationMetadata: ConversationMetadata;

  // Chat history per profile
  chatHistory: Record<string, string[]>; // profileId -> message IDs

  // Selected model
  selectedModel: string;

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  setConversationMetadata: (metadata: ConversationMetadata) => void;
  updateConversationMetadata: (metadata: Partial<ConversationMetadata>) => void;
  clearConversationMetadata: () => void;

  addChatMessage: (profileId: string, messageId: string) => void;
  clearChatHistory: (profileId?: string) => void;
  getChatHistory: (profileId: string) => string[];

  setSelectedModel: (model: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility
  resetState: () => void;
}

const GeminiChatContext = createContext<GeminiChatState | undefined>(undefined);

const initialMetadata: ConversationMetadata = {
  chatId: null,
  replyId: null,
  rcId: null,
};

/**
 * Provider Component
 */
export function GeminiChatProvider({ children }: { children: ReactNode }) {
  const [conversationMetadata, setConversationMetadataState] =
    useState<ConversationMetadata>(initialMetadata);
  const [chatHistory, setChatHistory] = useState<Record<string, string[]>>({});
  const [selectedModel, setSelectedModel] =
    useState<string>(GEMINI_MODEL_2_5_PRO);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update conversation metadata completely
  const setConversationMetadata = useCallback(
    (metadata: ConversationMetadata) => {
      setConversationMetadataState(metadata);
    },
    []
  );

  // Merge partial metadata updates
  const updateConversationMetadata = useCallback(
    (metadata: Partial<ConversationMetadata>) => {
      setConversationMetadataState((prev) => ({
        ...prev,
        ...metadata,
      }));
    },
    []
  );

  // Clear conversation metadata (start new conversation)
  const clearConversationMetadata = useCallback(() => {
    setConversationMetadataState(initialMetadata);
  }, []);

  // Add message to chat history for a profile
  const addChatMessage = useCallback((profileId: string, messageId: string) => {
    setChatHistory((prev) => ({
      ...prev,
      [profileId]: [...(prev[profileId] || []), messageId],
    }));
  }, []);

  // Clear chat history for a profile or all profiles
  const clearChatHistory = useCallback((profileId?: string) => {
    if (profileId) {
      setChatHistory((prev) => ({
        ...prev,
        [profileId]: [],
      }));
    } else {
      setChatHistory({});
    }
  }, []);

  // Get chat history for a profile
  const getChatHistory = useCallback(
    (profileId: string): string[] => {
      return chatHistory[profileId] || [];
    },
    [chatHistory]
  );

  // Reset all state
  const resetState = useCallback(() => {
    setConversationMetadataState(initialMetadata);
    setChatHistory({});
    setSelectedModel(GEMINI_MODEL_2_5_PRO);
    setIsLoading(false);
    setError(null);
  }, []);

  const value: GeminiChatState = {
    conversationMetadata,
    chatHistory,
    selectedModel,
    isLoading,
    error,

    setConversationMetadata,
    updateConversationMetadata,
    clearConversationMetadata,
    addChatMessage,
    clearChatHistory,
    getChatHistory,
    setSelectedModel,
    setIsLoading,
    setError,

    resetState,
  };

  return (
    <GeminiChatContext.Provider value={value}>
      {children}
    </GeminiChatContext.Provider>
  );
}

/**
 * Hook to use Gemini Chat Context
 */
export function useGeminiChat(): GeminiChatState {
  const context = useContext(GeminiChatContext);
  if (!context) {
    throw new Error(
      "useGeminiChat must be used within GeminiChatProvider. Wrap your component tree with <GeminiChatProvider>."
    );
  }
  return context;
}

export default GeminiChatContext;
