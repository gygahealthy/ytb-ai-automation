import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Eye, EyeOff, Clipboard, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatUI, { Message } from "../../components/automation/ChatUI";
import IPCLog from "../../components/automation/IPCLog";
import { InstanceState } from "../../../shared/types/automation.types";

export default function ChatAutomation() {
  // Route parameters - if instanceId is present, we're in multi-instance mode
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();

  const [isTyping, setIsTyping] = useState(false);
  const [showLog, setShowLog] = useState(true);
  const [messages, setMessages] = useState<Message[]>([{ id: 1, from: "system", text: "Chat automation initialized." }]);
  const [logLines, setLogLines] = useState<string[]>(["IPC log initialized..."]);
  const [isBrowserReady, setIsBrowserReady] = useState(false);
  const [instanceState, setInstanceState] = useState<InstanceState | null>(null);

  // Multi-instance mode: load instance state
  useEffect(() => {
    if (!instanceId) return;

    // Load instance details
    window.electronAPI.automation.get(instanceId).then((res: any) => {
      if (res && res.success && res.data) {
        const state: InstanceState = res.data;
        setInstanceState(state);
        setIsBrowserReady(state.status === "running");
        // load persisted chat history if present
        if (Array.isArray(state.chatHistory) && state.chatHistory.length > 0) {
          setMessages(state.chatHistory.map((c: any, idx: number) => ({ id: idx + 1, from: c.from, text: c.text, ts: c.ts })));
        }
        setLogLines((s) => [...s, `Connected to instance ${instanceId} (Profile: ${state.profileId})`]);
      } else {
        setLogLines((s) => [...s, `Failed to load instance ${instanceId}: ${res?.error ?? "not found"}`]);
      }
    });

    // Listen for instance updates
    const unsubStatus = window.electronAPI.automation.onInstanceStatus((data: any) => {
      if (data.instanceId === instanceId) {
        setLogLines((s) => [...s, `Instance status: ${data.status}`]);
        setIsBrowserReady(data.status === "running");
        if (data.status === 'stopped' || data.status === 'stopping') {
          // clear UI messages when instance is stopping or stopped
          setMessages([]);
        }
      }
    });

    const unsubUpdated = window.electronAPI.automation.onInstanceUpdated((inst: InstanceState) => {
      if (inst.instanceId === instanceId) {
        // update chat history if present
        if (Array.isArray(inst.chatHistory)) {
          setMessages(inst.chatHistory.map((c: any, idx: number) => ({ id: idx + 1, from: c.from, text: c.text, ts: c.ts })));
        }
        setInstanceState(inst);
      }
    });

    const unsubUnregistered = window.electronAPI.automation.onInstanceUnregistered((unregId: string) => {
      if (unregId === instanceId) {
        setMessages([]);
      }
    });

    return () => {
      try { unsubStatus(); } catch {};
      try { unsubUpdated(); } catch {};
      try { unsubUnregistered(); } catch {};
    };
  }, [instanceId]);

  const handleSend = (text: string) => {
    if (!text.trim() || !instanceId) return;

    // Don't manually add messages here - let the backend update instance state
    // and the onInstanceUpdated listener will refresh the UI automatically
    setLogLines((s) => [...s, `Sending message to instance ${instanceId}...`]);
    setIsTyping(true);

    window.electronAPI.automation.sendMessage(instanceId, text).then((res: any) => {
      setIsTyping(false);
      
      if (!res || !res.success) {
        setLogLines((s) => [...s, `Failed to send message: ${res?.error ?? "unknown"}`]);
        return;
      }

      const response = res.data;
      setLogLines((s) => [...s, `Received response (${response.content.length} chars)`]);
      // Note: Messages will be updated automatically via onInstanceUpdated listener
    });
  };

  // no-op: single-instance mode removed; component operates in multi-instance mode only

  return (
  <div className="p-8 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {instanceId && (
            <button
              onClick={() => navigate('/automation/instance')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {instanceId ? `Chat Instance: ${instanceState?.profileId || instanceId}` : 'Chat Automation'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {instanceId ? 'Connected to running automation instance' : 'Test and run chat-based automations'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col min-h-0 min-w-0">
          {/* ChatUI will handle its own internal scrolling */}
          <ChatUI messages={messages} onSend={handleSend} canSend={isBrowserReady} isTyping={isTyping} partialBotText={null} />
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
