import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import ChatUI, { Message } from "../automation/ChatUI";
import { useAlert } from "../../hooks/useAlert";
import { useSettingsStore } from "../../store/settings.store";
import { useGeminiChatSession } from "../../hooks/useGeminiChatSession";
import electronApi from "../../ipc";

interface ChatModalProps {
  isOpen: boolean;
  profileId: string | null;
  onClose: () => void;
}

export default function ChatModal({
  isOpen,
  profileId,
  onClose,
}: ChatModalProps) {
  const { show: showAlert } = useAlert();
  const [messages, setMessages] = useState<Message[]>([]);
  const [canSend, setCanSend] = useState(true);
  const [streamChannel, setStreamChannel] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use the custom hook for conversation management
  const chat = useGeminiChatSession(profileId);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setCanSend(true);
      setStreamChannel(null);
      chat.resetConversation();
    } else {
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, chat]);

  // Listen for streaming chunks when streamChannel is set
  useEffect(() => {
    if (!streamChannel) return;

    const unsubscribe = electronApi.on(streamChannel, (data: any) => {
      if (data.type === "chunk") {
        // Add or update bot message with streamed text
        const chunk = data.data;
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];

          // If the last message is from the bot and incomplete, append to it
          if (lastMsg && lastMsg.from === "bot") {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMsg,
                text:
                  lastMsg.text + (chunk.index > 0 ? "\n\n" : "") + chunk.text,
              },
            ];
          }

          // Otherwise create a new bot message
          const botMessage: Message = {
            id: prev.length,
            from: "bot",
            text: chunk.text,
            ts: new Date().toLocaleTimeString(),
          };
          return [...prev, botMessage];
        });
      } else if (data.type === "complete") {
        setCanSend(true);
        setStreamChannel(null);
        // Extract and store metadata from streaming completion via hook
        chat.handleStreamComplete(data.data);
      } else if (data.type === "error") {
        setCanSend(true);
        setStreamChannel(null);
        showAlert({
          message: data.error || "Stream error occurred",
          severity: "error",
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [streamChannel, showAlert, chat]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!profileId || !text.trim()) return;

      try {
        setCanSend(false);

        // Add user message
        const userMessage: Message = {
          id: messages.length,
          from: "user",
          text: text.trim(),
          ts: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Get streaming setting from store
        const { streamingEnabled } = useSettingsStore.getState();

        // Send message via hook (handles all context preservation)
        const response = await chat.sendMessage(text.trim(), {
          stream: streamingEnabled,
        });

        if (response && response.success) {
          if (response.streaming && response.channel) {
            // Set up streaming listener
            setStreamChannel(response.channel);
          } else {
            // Non-streaming response - add bot message
            const botMessage: Message = {
              id: messages.length + 1,
              from: "bot",
              text: response.data || "",
              ts: new Date().toLocaleTimeString(),
            };
            setMessages((prev) => [...prev, botMessage]);
            setCanSend(true);
          }
        } else if (response) {
          showAlert({
            message: response.error || "Failed to send message",
            severity: "error",
          });
          setCanSend(true);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        showAlert({
          message: "Failed to send message. Please try again.",
          severity: "error",
        });
        setCanSend(true);
      }
    },
    [profileId, messages.length, showAlert, chat]
  );

  if (!isOpen || !profileId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[920px] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Modern Header with Gradient Background */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-6 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white">
                Gemini Chat Assistant
              </h2>
              <p className="text-xs text-blue-100">
                Profile: {profileId.substring(0, 12)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 text-white hover:scale-110 active:scale-95"
            title="Close chat"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat UI with better spacing */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <ChatUI
            ref={inputRef}
            messages={messages}
            onSend={handleSendMessage}
            canSend={canSend && !chat.isLoading}
            isTyping={chat.isLoading}
          />
        </div>

        {/* Modern Footer Status Bar */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 h-5">
              {chat.isLoading ? (
                <div className="flex gap-1">
                  <div
                    className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"
                    style={{ animationDuration: "1.5s" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"
                    style={{
                      animationDuration: "1.5s",
                      animationDelay: "0.2s",
                    }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"
                    style={{
                      animationDuration: "1.5s",
                      animationDelay: "0.4s",
                    }}
                  ></div>
                </div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {messages.length} {messages.length === 1 ? "message" : "messages"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
