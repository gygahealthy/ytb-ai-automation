import { useEffect, useRef, useState } from "react";
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

export default function ChatUI({ messages, onSend, canSend = false }: ChatUIProps) {
  const { isTyping = false, partialBotText = null } = arguments[0] as ChatUIProps;
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
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-2 space-y-4 p-3 bg-gradient-to-b from-white/60 to-gray-50 dark:from-gray-900/30 dark:to-gray-900/10 rounded-md"
      >
        {messages.map((m) => {
          const isUser = m.from === "user";
          return (
            <div key={m.id} className={isUser ? "flex justify-end items-end" : "flex justify-start items-start"}>
              {!isUser && (
                <div className="mr-3 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs">B</div>
                </div>
              )}

              <div
                className={
                  "break-words px-4 py-3 rounded-lg shadow-sm " +
                  (isUser
                    ? "bg-primary-500 text-white rounded-br-none max-w-[75%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[45%]"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none max-w-[75%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[45%]")
                }
              >
                  <div className="text-sm leading-relaxed">
                    {m.from === "bot" ? (
                      <MarkdownRenderer content={m.text} />
                    ) : (
                      m.text
                    )}
                  </div>
                <div className="mt-2 text-xs opacity-60 text-right">{m.ts ?? new Date().toLocaleTimeString()}</div>
              </div>

              {isUser && (
                <div className="ml-3 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 text-xs">Me</div>
                </div>
              )}
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start items-start">
            <div className="mr-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs">B</div>
            </div>
            <div className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 animate-pulse max-w-[75%] sm:max-w-[65%] md:max-w-[55%] lg:max-w-[45%]">
              <div className="text-sm leading-relaxed">
                {partialBotText ? (
                  <MarkdownRenderer content={partialBotText} />
                ) : (
                  "..."
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
          placeholder="Ask a question or type a command..."
          aria-label="Type a message"
          disabled={!canSend}
        />

        <button
          onClick={send}
          disabled={!input.trim() || !canSend}
          aria-label="Send message"
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
