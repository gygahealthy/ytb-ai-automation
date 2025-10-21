import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import electronApi from "../ipc";
import { replaceTemplate } from "../../shared/utils/template-replacement.util";

export interface ComponentAIPromptConfig {
  id: string;
  componentName: string;
  profileId: string;
  promptId: number;
  aiModel?: string;
  enabled?: boolean;
  useTempChat?: boolean;
  keepContext?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComponentAIPromptState {
  loading: boolean;
  error: string | null;
  config?: ComponentAIPromptConfig | null;
  refresh: () => Promise<void>;
  sendPrompt: (
    data: Record<string, any>,
    options?: { stream?: boolean; requestId?: string; model?: string }
  ) => Promise<any>;
}

// Context holds per-component cached state and helpers. Mount provider at App level.
export interface PerComponentState {
  config?: ComponentAIPromptConfig | null;
  loading: boolean;
  error?: string | null;
}

export interface ComponentAIPromptContextState {
  // accessors
  fetchConfig: (
    componentName: string
  ) => Promise<ComponentAIPromptConfig | null>;
  getCachedConfig: (componentName: string) => PerComponentState | undefined;
  sendPromptFor: (
    componentName: string,
    data: Record<string, any>,
    options?: { stream?: boolean; requestId?: string; model?: string }
  ) => Promise<any>;
  getConversation?: (componentName: string) => {
    chatId?: string | null;
    replyId?: string | null;
    rcId?: string | null;
  } | null;
  clearConversation?: (componentName: string) => void;
}

const ComponentAIPromptContext = createContext<
  ComponentAIPromptContextState | undefined
>(undefined);

export function ComponentAIPromptProvider({
  children,
}: {
  children: ReactNode;
}) {
  // maps per-component
  const [configs, setConfigs] = useState<
    Record<string, ComponentAIPromptConfig | null>
  >({});
  // per-component stored conversation metadata (client-side persistence)
  const [conversationMap, setConversationMap] = useState<
    Record<
      string,
      {
        chatId?: string | null;
        replyId?: string | null;
        rcId?: string | null;
      } | null
    >
  >({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string | null>>({});

  const setLoadingFor = (name: string, v: boolean) =>
    setLoadingMap((s) => ({ ...s, [name]: v }));
  const setErrorFor = (name: string, v: string | null) =>
    setErrorMap((s) => ({ ...s, [name]: v }));
  const setConfigFor = (name: string, cfg: ComponentAIPromptConfig | null) =>
    setConfigs((s) => ({ ...s, [name]: cfg }));

  const setConversationFor = (
    name: string,
    v: {
      chatId?: string | null;
      replyId?: string | null;
      rcId?: string | null;
    } | null
  ) => setConversationMap((s) => ({ ...s, [name]: v }));

  const clearConversationFor = (name: string) =>
    setConversationMap((s) => ({ ...s, [name]: null }));

  const fetchConfig = useCallback(
    async (name: string) => {
      // fast return if already loaded (including explicit null)
      if (configs && Object.prototype.hasOwnProperty.call(configs, name)) {
        return configs[name] || null;
      }

      setLoadingFor(name, true);
      setErrorFor(name, null);
      try {
        const res = await (electronApi as any).aiPrompt.getConfig(name);
        if (!res || !res.success) {
          setConfigFor(name, null);
          setErrorFor(name, res?.error || "failed-to-load-config");
          return null;
        }
        setConfigFor(name, res.data || null);
        return res.data || null;
      } catch (err) {
        setConfigFor(name, null);
        setErrorFor(name, err instanceof Error ? err.message : String(err));
        return null;
      } finally {
        setLoadingFor(name, false);
      }
    },
    [configs]
  );

  // Replace placeholders using shared template replacement utility (normalizes keys to snake_case)
  const replacePlaceholders = useCallback(
    (
      template: string,
      data: Record<string, any>,
      occurrenceConfig?: Record<string, number[]>
    ) => {
      // Use new template replacement util with optional occurrence config for selective replacement
      return replaceTemplate(template, data || {}, occurrenceConfig);
    },
    []
  );

  // sendPrompt: either route via backend aiPrompt.callAI (preferred for server-side control)
  // or send directly to gemini.chat.send when config.useTempChat indicates ephemeral/local behaviour.
  // sendPrompt for named component. Ensures config is loaded first.
  const sendPromptFor = useCallback(
    async (
      name: string,
      data: Record<string, any>,
      options?: { stream?: boolean; requestId?: string; model?: string }
    ) => {
      // ensure config
      let cfg = configs[name];
      if (cfg === undefined) {
        cfg = await fetchConfig(name);
      }
      if (!cfg) return { success: false, error: "no-config" };

      try {
        const mp = await electronApi.masterPrompts.getById(cfg.promptId);
        if (!mp || !mp.success || !mp.data)
          return { success: false, error: "prompt-not-found" };

        const promptTemplate = mp.data.promptTemplate || mp.data.prompt || "";
        // Pass occurrence config for selective variable replacement
        const processed = replacePlaceholders(
          promptTemplate,
          data || {},
          mp.data.variableOccurrencesConfig
        );

        const callViaBackend = true;
        if (callViaBackend) {
          // include conversationContext only when component config asks to keepContext
          const conversationContext = cfg.keepContext
            ? conversationMap[name] || undefined
            : undefined;

          const req: any = {
            componentName: cfg.componentName,
            profileId: cfg.profileId,
            data,
            processedPrompt: processed,
            stream: options?.stream,
            requestId: options?.requestId,
          };

          if (conversationContext) {
            req.conversationContext = {
              chatId: conversationContext.chatId || undefined,
              replyId: conversationContext.replyId || undefined,
              rcId: conversationContext.rcId || undefined,
            };
          }

          const resp = await (electronApi as any).aiPrompt.callAI(req);

          // Update client-side conversation metadata if config requests persistence
          if (cfg.keepContext && resp?.storedMetadata) {
            setConversationFor(name, {
              chatId: resp.storedMetadata.cid || null,
              replyId: resp.storedMetadata.rid || null,
              rcId: resp.storedMetadata.rcid || null,
            });
          }

          return resp;
        }

        const geminiReq = {
          profileId: cfg.profileId,
          prompt: processed,
          stream: options?.stream,
          requestId: options?.requestId,
          mode: cfg.useTempChat ? "EPHEMERAL" : "PERSISTENT",
          model: options?.model || cfg.aiModel,
        };

        // For direct sends, include conversationContext when keepContext is true
        if (cfg.keepContext && conversationMap[name]) {
          (geminiReq as any).conversationContext = {
            chatId: conversationMap[name]?.chatId || "",
            replyId: conversationMap[name]?.replyId || "",
            rcId: conversationMap[name]?.rcId || "",
          };
        }

        const resp = await electronApi.gemini.chat.send(geminiReq);

        // Update stored metadata from response when requested
        if (cfg.keepContext && resp?.storedMetadata) {
          setConversationFor(name, {
            chatId: resp.storedMetadata.cid || null,
            replyId: resp.storedMetadata.rid || null,
            rcId: resp.storedMetadata.rcid || null,
          });
        }

        return resp;
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    [configs, fetchConfig, replacePlaceholders, conversationMap]
  );

  const state: ComponentAIPromptContextState = {
    fetchConfig,
    getCachedConfig: (name: string) => ({
      config: configs[name],
      loading: !!loadingMap[name],
      error: errorMap[name],
    }),
    sendPromptFor,
    getConversation: (name: string) => conversationMap[name] || null,
    clearConversation: (name: string) => clearConversationFor(name),
  };

  return (
    <ComponentAIPromptContext.Provider value={state}>
      {children}
    </ComponentAIPromptContext.Provider>
  );
}

/**
 * Hook for consumers. Pass the componentName and it will auto-load config
 * and expose a sendPrompt helper.
 */
export function useComponentAIPromptContext() {
  const ctx = useContext(ComponentAIPromptContext);
  if (!ctx)
    throw new Error(
      "useComponentAIPromptContext must be used within ComponentAIPromptProvider"
    );
  return ctx;
}

export default ComponentAIPromptContext;
