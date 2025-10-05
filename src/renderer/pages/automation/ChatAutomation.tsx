import { useState } from "react";
import { Eye, EyeOff, Clipboard } from "lucide-react";
import ChatToolbar from "../../components/automation/ChatToolbar";
import ChatUI, { Message } from "../../components/automation/ChatUI";
import IPCLog from "../../components/automation/IPCLog";
import { useEffect } from "react";

export default function ChatAutomation() {
  const [profiles, setProfiles] = useState<{ id: string; name: string }[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>(undefined);
  const [provider, setProvider] = useState<"chatgpt" | "gemini">("chatgpt");
  const [isTyping, setIsTyping] = useState(false);
  const [partialBotText] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(true);
  const [messages, setMessages] = useState<Message[]>([{ id: 1, from: "system", text: "Chat automation initialized." }]);
  const [logLines, setLogLines] = useState<string[]>(["IPC log initialized..."]);
  const [isBrowserReady, setIsBrowserReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleSend = (text: string) => {
    if (!text.trim() || !sessionId) return;
    const nextId = messages.length + 1;
    setMessages((s) => [...s, { id: nextId, from: "user", text }]);
    setLogLines((s) => [...s, `Sending message to ${provider}...`]);
    setIsTyping(true);

    // Send message via chat automation service
    window.electronAPI.chatAutomation.sendMessage(sessionId, text).then((res: any) => {
      if (!res || !res.success) {
        setLogLines((s) => [...s, `Failed to send message: ${res?.error ?? "unknown"}`]);
        setIsTyping(false);
        return;
      }

      const response = res.data;
      const botId = messages.length + 2;
      setMessages((s) => [
        ...s,
        {
          id: botId,
          from: "bot",
          text: response.content,
          ts: new Date(response.timestamp).toLocaleTimeString(),
        },
      ]);
      setLogLines((s) => [...s, `Received response (${response.content.length} chars)`]);
      setIsTyping(false);
    });
  };

  const handleRun = () => {
    // Require a profile selection
    if (!selectedProfileId) {
      setLogLines((s) => [...s, "No profile selected. Please choose a profile first."]);
      return;
    }

    setLogLines((s) => [...s, `Initializing ${provider} session with profile...`]);

    // Initialize chat automation session
    window.electronAPI.chatAutomation.init(selectedProfileId, provider).then((res: any) => {
      if (!res || !res.success) {
        setLogLines((s) => [...s, `Failed to initialize session: ${res?.error ?? "unknown"}`]);
        return;
      }

      const { sessionId: newSessionId, debugPort } = res.data;
      setSessionId(newSessionId);
      setIsBrowserReady(true);
      setLogLines((s) => [...s, `Session ${newSessionId} started (debug port: ${debugPort})`]);
    });
  };

  useEffect(() => {
    // Load profiles from main process
    window.electronAPI.profile.getAll().then((res: any) => {
      if (res && res.success && Array.isArray(res.data)) {
        setProfiles(res.data.map((p: any) => ({ id: p.id, name: p.name })));
        // auto-select first profile if available
        if (res.data.length > 0) {
          setSelectedProfileId(res.data[0].id);
        }
      } else {
        setLogLines((s) => [...s, `Failed to load profiles: ${res?.error ?? 'unknown'}`]);
      }
    });
  }, []);

  useEffect(() => {
    // default provider to gemini
    setProvider("gemini");
  }, []);

  return (
  <div className="p-8 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Chat Automation</h1>
          <p className="text-gray-600 dark:text-gray-400">Test and run chat-based automations</p>
        </div>

        <ChatToolbar
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onChangeProfile={(id: string) => setSelectedProfileId(id)}
          provider={provider}
          onChangeProvider={setProvider}
          onRun={handleRun}
        />
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col min-h-0 min-w-0">
          {/* ChatUI will handle its own internal scrolling */}
          <ChatUI messages={messages} onSend={handleSend} canSend={isBrowserReady} isTyping={isTyping} partialBotText={partialBotText} />
        </div>

        {showLog && (
          <div className="w-full sm:w-80 max-w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col flex-shrink-0">
            {/* IPC log is intentionally non-scrollable; left ChatUI is the scrollable area */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold">IPC Log</h3>
              </div>
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowLog(false)} aria-label="Hide IPC log">
                <EyeOff className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <IPCLog logLines={logLines} onClear={() => setLogLines([])} />
          </div>
        )}
        {!showLog && (
          <div className="w-12 flex items-start">
            <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setShowLog(true)} aria-label="Show IPC log">
              <Eye className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
