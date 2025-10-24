import { useState, useEffect } from "react";
import { ComponentPromptSelector } from "@/renderer/components/master-prompt/prompt-playground/ComponentPromptSelector";
import { VariableInputForm } from "@/renderer/components/master-prompt/prompt-playground/VariableInputForm";
import { PromptPreview } from "@/renderer/components/master-prompt/prompt-playground/PromptPreview";
import { AIOutputDisplay } from "@/renderer/components/master-prompt/prompt-playground/AIOutputDisplay";
import { replaceTemplate } from "@/shared/utils/template-replacement.util";

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

const electronApi = (window as any).electronAPI;

export default function PromptPlaygroundPage() {
  const [selectedConfig, setSelectedConfig] = useState<ComponentAIPromptConfig | null>(null);
  const [masterPrompt, setMasterPrompt] = useState<any | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  // Load master prompt when config is selected
  useEffect(() => {
    if (!selectedConfig) {
      setMasterPrompt(null);
      setVariableValues({});
      setAiOutput(null);
      setError(null);
      return;
    }

    loadMasterPrompt(selectedConfig.promptId);
  }, [selectedConfig]);

  const loadMasterPrompt = async (promptId: number) => {
    setLoadingPrompt(true);
    setError(null);
    try {
      const res = await electronApi.masterPrompts.getById(promptId);
      if (res?.success && res.data) {
        setMasterPrompt(res.data);
        // Initialize variable values with empty strings
        if (res.data.variableOccurrencesConfig) {
          const initialValues: Record<string, string> = {};
          Object.keys(res.data.variableOccurrencesConfig).forEach((key) => {
            initialValues[key] = "";
          });
          setVariableValues(initialValues);
        }
      } else {
        setError(res?.error || "Failed to load master prompt");
        setMasterPrompt(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setMasterPrompt(null);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSendToAI = async () => {
    if (!selectedConfig) {
      setError("Please select a component configuration first");
      return;
    }

    if (!masterPrompt) {
      setError("No prompt loaded. Please select a valid configuration.");
      return;
    }

    setIsSending(true);
    setError(null);
    setAiOutput(null);

    try {
      // Process the template with variable values and occurrence config
      const processedPrompt = replaceTemplate(
        masterPrompt.promptTemplate || masterPrompt.prompt || "",
        variableValues,
        masterPrompt.variableOccurrencesConfig || undefined
      );

      // Call AI via IPC
      const response = await electronApi.aiPrompt.callAI({
        componentName: selectedConfig.componentName,
        profileId: selectedConfig.profileId || "default",
        data: variableValues,
        processedPrompt,
        stream: false,
      });

      if (response?.success) {
        // Extract text from response
        let outputText = "";
        if (typeof response.data === "string") {
          outputText = response.data;
        } else if (response.data?.text) {
          outputText = response.data.text;
        } else if (response.data?.response) {
          outputText = response.data.response;
        } else {
          outputText = JSON.stringify(response.data, null, 2);
        }
        setAiOutput(outputText);
      } else {
        setError(response?.error || "Failed to get AI response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-6 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Prompt Playground</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Test and preview AI prompt replacements in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (1/3) */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-transparent">
          {/* Component Selector (Top) */}
          <div className="h-1/2 overflow-hidden p-4">
            <div className="h-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
              <ComponentPromptSelector selectedConfig={selectedConfig} onSelect={setSelectedConfig} />
            </div>
          </div>

          {/* Variable Input Form (Bottom) */}
          <div className="h-1/2 overflow-hidden p-4">
            <div className="h-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
              {loadingPrompt ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading prompt...</div>
                </div>
              ) : (
                <VariableInputForm
                  variableOccurrenceConfig={masterPrompt?.variableOccurrencesConfig || null}
                  values={variableValues}
                  onValueChange={handleVariableChange}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel (2/3) */}
        <div className="flex-1 flex flex-col bg-transparent">
          {/* Prompt Preview (Top) */}
          <div className="h-1/2 overflow-hidden p-4">
            <div className="h-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
              <PromptPreview
                template={masterPrompt?.promptTemplate || masterPrompt?.prompt || ""}
                variableOccurrenceConfig={masterPrompt?.variableOccurrencesConfig || null}
                values={variableValues}
                onSendToAI={handleSendToAI}
                isSending={isSending}
              />
            </div>
          </div>

          {/* AI Output (Bottom) */}
          <div className="h-1/2 overflow-hidden p-4">
            <div className="h-full rounded-lg shadow-md bg-white dark:bg-gray-800 p-4">
              <AIOutputDisplay output={aiOutput} isLoading={isSending} error={error} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
