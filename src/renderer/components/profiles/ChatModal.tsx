import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import ChatUI, { Message } from "../automation/ChatUI";
import { useAlert } from "../../hooks/useAlert";
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
  const [isLoading, setIsLoading] = useState(false);
  const [canSend, setCanSend] = useState(true);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setIsLoading(false);
      setCanSend(true);
    }
  }, [isOpen]);

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

        // Send to Gemini API via IPC
        setIsLoading(true);

        const response = await electronApi.gemini.chat.send({
          profileId,
          prompt: text.trim(),
        });

        setIsLoading(false);

        if (response.success && response.data) {
          // Add bot response message
          const botMessage: Message = {
            id: messages.length + 1,
            from: "bot",
            text: response.data,
            ts: new Date().toLocaleTimeString(),
          };
          setMessages((prev) => [...prev, botMessage]);
        } else {
          showAlert({
            message: response.error || "Failed to send message",
            severity: "error",
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        showAlert({
          message: "Failed to send message. Please try again.",
          severity: "error",
        });
      } finally {
        setIsLoading(false);
        setCanSend(true);
      }
    },
    [profileId, messages.length, showAlert]
  );

  if (!isOpen || !profileId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chat Test
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Chat UI */}
        <div className="flex-1 overflow-hidden">
          <ChatUI
            messages={messages}
            onSend={handleSendMessage}
            canSend={canSend && !isLoading}
            isTyping={isLoading}
          />
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Profile ID: {profileId.substring(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  );
}
