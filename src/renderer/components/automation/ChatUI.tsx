import { useEffect, useRef, useState, forwardRef, ForwardedRef } from "react";
import { Send } from "lucide-react";
import { MarkdownRenderer } from "../../utils/markdown-renderer";

export type Message = { id: number; from: string; text: string; ts?: string };

interface Props {
  messages: Message[];
  onSend: (text: string) => void;
}

interface ChatUIProps extends Props {
  canSend?: boolean;
  isTyping?: boolean;
  partialBotText?: string | null;
}

const ChatUI = forwardRef<HTMLTextAreaElement, ChatUIProps>(function ChatUI(
  { messages, onSend, canSend = false, isTyping = false }: ChatUIProps,
  ref: ForwardedRef<HTMLTextAreaElement>
) {
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // smooth scroll to bottom
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center flex-col gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Start a conversation
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Type your question below to begin
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.from === "user";
          return (
            <div
              key={m.id}
              className={`flex items-end gap-3 animate-slideIn ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    G
                  </div>
                </div>
              )}

              <div
                className={`group max-w-sm lg:max-w-md xl:max-w-xl px-4 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg overflow-hidden ${
                  isUser
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600"
                }`}
              >
                <div className="text-sm leading-relaxed break-words word-break overflow-x-hidden">
                  {m.from === "bot" ? (
                    <MarkdownRenderer content={m.text} />
                  ) : (
                    m.text
                  )}
                </div>
                <div
                  className={`mt-2 text-xs ${
                    isUser
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  } text-right`}
                >
                  {m.ts ?? new Date().toLocaleTimeString()}
                </div>
              </div>

              {isUser && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    U
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-3 animate-slideIn">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                G
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-650 px-4 py-3 rounded-2xl rounded-bl-none border border-blue-200 dark:border-gray-600 shadow-md">
              <div className="flex gap-1.5 items-center h-6">
                <div
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"
                  style={{ animationDuration: "1.5s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"
                  style={{ animationDuration: "1.5s", animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"
                  style={{ animationDuration: "1.5s", animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area with Enhanced Design */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 shadow-lg">
        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            ref={ref}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
            placeholder="Type your message here... (Shift+Enter for new line)"
            aria-label="Type a message"
            disabled={!canSend}
            style={{ maxHeight: "120px" }}
          />

          <button
            onClick={send}
            disabled={!input.trim() || !canSend}
            aria-label="Send message"
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 shadow-md hover:shadow-lg active:scale-95"
            title={
              canSend && input.trim() ? "Send message" : "Enter message to send"
            }
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatUI;
