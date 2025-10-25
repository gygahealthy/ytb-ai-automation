import React from "react";
import { ChevronRight, ChevronLeft, Wand2 } from "lucide-react";
import { VideoPromptGenerator, VideoPrompt } from "@components/video-creation/script-creation/VideoPromptGenerator";
import { Step1_TopicAndStyle } from "@components/video-creation/script-creation/step-by-step/Step1_TopicAndStyle";
import { Step2_EditScriptAndVisualStyle } from "@components/video-creation/script-creation/step-by-step/Step2_EditScriptAndVisualStyle";
import { Step3_GeneratePrompts } from "@components/video-creation/script-creation/step-by-step/Step3_GeneratePrompts";
import { ScriptCreatePageToolbar } from "@components/video-creation/script-creation/ScriptCreatePageToolbar";
import { useScriptCreationStore } from "@store/script-creation.store";
import { useAlert } from "@hooks/useAlert";
import { replaceTemplate } from "@shared/utils/template-replacement.util";

const electronApi = (window as any).electronAPI;

const ScriptCreatePage: React.FC = () => {
  const { show: showAlert } = useAlert();

  // Get all state and actions from Zustand store
  const {
    topic,
    selectedTopic,
    selectedTopicId,
    topicSuggestions,
    numberOfTopics,
    videoStyle,
    visualStyle,
    editedScript,
    scriptLengthPreset,
    customWordCount,
    currentStep,
    viewMode,
    isGenerating,
    isGeneratingTopics,
    setTopic,
    setSelectedTopic,
    setSelectedTopicId,
    setTopicSuggestions,
    clearTopicSuggestions,
    setNumberOfTopics,
    setVideoStyle,
    setVisualStyle,
    setEditedScript,
    setVideoPrompts,
    setScriptLengthPreset,
    setCustomWordCount,
    setCurrentStep,
    setViewMode,
    setIsGenerating,
    setIsGeneratingTopics,
  } = useScriptCreationStore();

  // Helper function to parse topics from AI response
  const parseTopicsFromAIResponse = (text: string, maxTopics: number): string[] => {
    // Try to parse as JSON first (AI may return structured data)
    try {
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/m);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          const topics = parsed
            .map((item: any) => {
              if (typeof item === "string") return item;
              if (item.title) return item.title;
              if (item.description) return item.description;
              if (item.name) return item.name;
              return null;
            })
            .filter((t: any) => t && typeof t === "string" && t.length > 0)
            .slice(0, maxTopics);
          if (topics.length > 0) return topics;
        }
      }
    } catch (e) {
      // Not JSON, continue to text parsing
    }

    // Fall back to text parsing
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("{") && !l.startsWith("["));

    const topics: string[] = [];
    for (const line of lines) {
      const cleaned = line
        .replace(/^[\d]+[\.\)]\s*|^[-*•]\s*/, "")
        .replace(/^['"]|['"]$/g, "")
        .trim();
      if (cleaned && !cleaned.startsWith("{") && !cleaned.startsWith("[")) {
        topics.push(cleaned);
      }
    }

    return topics.slice(0, maxTopics);
  };

  const handleSuggestTopics = async () => {
    if (!topic.trim()) {
      showAlert({
        message: "Please enter a topic hint first",
        severity: "warning",
      });
      return;
    }

    setIsGeneratingTopics(true);
    try {
      const configResponse = await electronApi.aiPromptConf.getConfig("AITopicSuggestions");

      if (!configResponse?.success || !configResponse.data) {
        console.error("AITopicSuggestions config not found:", configResponse?.error);
        return;
      }

      const config = configResponse.data;

      const promptResponse = await electronApi.masterPrompts.getById(config.promptId);

      if (!promptResponse?.success || !promptResponse.data) {
        console.error("Failed to load master prompt");
        return;
      }

      const masterPrompt = promptResponse.data;
      const promptTemplate = masterPrompt.promptTemplate || masterPrompt.prompt || "";

      const variables = {
        user_input_keywords: topic,
        video_topic: topic,
        topic_hint: topic,
        number_of_topics: String(numberOfTopics),
      };

      const processedPrompt = replaceTemplate(promptTemplate, variables, masterPrompt.variableOccurrencesConfig || undefined);

      const response = await electronApi.aiPromptConf.callAI({
        componentName: config.componentName,
        profileId: config.profileId || "default",
        data: variables,
        processedPrompt,
        stream: false,
      });

      if (response?.success) {
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

        const topics = parseTopicsFromAIResponse(outputText, numberOfTopics);
        setTopicSuggestions(topics);
      } else {
        console.error("AI call failed:", response?.error);
        const errorMessage = response?.error || "Failed to generate topics";
        showAlert({
          title: "Topic Generation Failed",
          message: errorMessage,
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Failed to generate topics:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      showAlert({
        title: "Error",
        message: `Failed to generate topics: ${errorMsg}`,
        severity: "error",
      });
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string, id: string) => {
    setSelectedTopic(suggestion); // ✅ Store the full AI-generated topic text
    setSelectedTopicId(id);
    // Don't update the input field - just track the selection in context
  };

  const handleSelectHintTopic = (topic: string, id: string) => {
    setTopic(topic);
    setSelectedTopic(topic); // ✅ Also store in selectedTopic
    setSelectedTopicId(id);
    // Update input field when selecting from Hint section
  };

  const handleClearSuggestions = () => {
    clearTopicSuggestions();
  };

  const handleGenerateScript = async () => {
    const topicToUse = selectedTopic || topic; // ✅ Use selectedTopic if available (from AI selection), else use input
    if (!topicToUse.trim()) {
      showAlert({
        message: "Please enter or select a topic first",
        severity: "warning",
      });
      return;
    }
    setIsGenerating(true);
    try {
      // First, get the config for ScriptStyleSelector to retrieve the profile
      const configResponse = await electronApi.aiPromptConf.getConfig("ScriptStyleSelector");
      if (!configResponse?.success || !configResponse.data) {
        throw new Error(configResponse?.error || "No configuration found for ScriptStyleSelector component");
      }

      const componentConfig = configResponse.data;
      const profileId = componentConfig.profileId || "default";

      // Call AI service with real parameters using the profile from config
      const response = await electronApi.aiPromptConf.callAI({
        componentName: "ScriptStyleSelector",
        profileId: profileId,
        data: {
          video_topic: topicToUse,
          video_style: videoStyle,
          target_word_count:
            scriptLengthPreset === "custom"
              ? customWordCount
              : scriptLengthPreset === "short"
              ? 100
              : scriptLengthPreset === "medium"
              ? 150
              : 250,
        },
        stream: false,
      });

      if (response?.success) {
        // Extract script text from response
        let scriptText = "";
        if (typeof response.data === "string") {
          scriptText = response.data;
        } else if (response.data?.text) {
          scriptText = response.data.text;
        } else if (response.data?.response) {
          scriptText = response.data.response;
        } else {
          scriptText = JSON.stringify(response.data, null, 2);
        }

        setEditedScript(scriptText);
        showAlert({
          title: "Success",
          message: "Script generated successfully!",
          severity: "success",
        });
        setCurrentStep(2);
      } else {
        const errorMessage = response?.error || "Failed to generate script";
        showAlert({
          title: "Script Generation Failed",
          message: errorMessage,
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error generating script:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      showAlert({
        title: "Error",
        message: `Failed to generate script: ${errorMsg}`,
        severity: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinueToPrompts = () => {
    if (!editedScript.trim()) {
      showAlert({
        message: "Please review or edit the script first",
        severity: "warning",
      });
      return;
    }
    setCurrentStep(3);
  };

  const handlePromptsGenerated = (prompts: VideoPrompt[]) => {
    setVideoPrompts(prompts);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      <ScriptCreatePageToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        hasTopicOrScript={!!(selectedTopic || topic.trim() || editedScript.trim())}
        hasScript={!!editedScript.trim()}
      />
      <div className="flex-1 overflow-hidden">
        {/* Step-by-Step Mode */}
        {viewMode === "step-by-step" && (
          <>
            {currentStep === 1 && (
              <Step1_TopicAndStyle
                topic={topic}
                onTopicChange={setTopic}
                numberOfTopics={numberOfTopics}
                onNumberOfTopicsChange={setNumberOfTopics}
                onGenerateTopics={handleSuggestTopics}
                suggestions={topicSuggestions}
                selectedTopicId={selectedTopicId}
                onSelectSuggestion={handleSelectSuggestion}
                onSelectHintTopic={handleSelectHintTopic}
                onClearSuggestions={handleClearSuggestions}
                isGenerating={isGeneratingTopics}
                videoStyle={videoStyle}
                onVideoStyleChange={setVideoStyle}
                scriptLengthPreset={scriptLengthPreset}
                onScriptLengthChange={setScriptLengthPreset}
                customWordCount={customWordCount}
                onCustomWordCountChange={setCustomWordCount}
              />
            )}

            {currentStep === 2 && (
              <Step2_EditScriptAndVisualStyle
                editedScript={editedScript}
                onScriptChange={setEditedScript}
                visualStyle={visualStyle}
                onVisualStyleChange={setVisualStyle}
              />
            )}

            {currentStep === 3 && (
              <Step3_GeneratePrompts
                script={editedScript}
                topic={topic}
                selectedTopic={selectedTopic}
                videoStyle={videoStyle}
                visualStyle={visualStyle}
                scriptLengthPreset={scriptLengthPreset}
                customWordCount={customWordCount}
                onPromptsGenerated={handlePromptsGenerated}
                onBackToEdit={() => setCurrentStep(2)}
              />
            )}
          </>
        )}

        {/* Simple Mode - All inputs on one page */}
        {viewMode === "simple" && (
          <div className="h-full px-6 py-8">
            <VideoPromptGenerator
              script={editedScript}
              style={`${videoStyle} with ${visualStyle} visual style`}
              topic={topic}
              selectedTopic={selectedTopic} // ✅ Pass selectedTopic
              videoStyle={videoStyle}
              visualStyle={visualStyle}
              scriptLengthPreset={scriptLengthPreset}
              customWordCount={customWordCount}
              onPromptsGenerated={handlePromptsGenerated}
              onBackToEdit={() => setCurrentStep(2)}
              simpleMode={true}
              onTopicChange={setTopic}
              onVideoStyleChange={setVideoStyle}
              onVisualStyleChange={setVisualStyle}
              onScriptChange={setEditedScript}
              onScriptLengthChange={setScriptLengthPreset}
              onCustomWordCountChange={setCustomWordCount}
            />
          </div>
        )}
      </div>

      {/* Floating Circular Action Buttons - Only in step-by-step mode */}
      {viewMode === "step-by-step" && currentStep === 1 && (
        <button
          onClick={handleGenerateScript}
          disabled={!topic.trim() || isGenerating}
          title="Generate Video Script"
          className="fixed top-20 right-6 z-20 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Wand2 className="w-7 h-7" />
          )}
        </button>
      )}

      {viewMode === "step-by-step" && currentStep === 2 && (
        <>
          {/* Back Button */}
          <button
            onClick={() => setCurrentStep(1)}
            title="Back to Topic & Style"
            className="fixed top-20 right-24 z-20 w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          {/* Continue Button */}
          <button
            onClick={handleContinueToPrompts}
            disabled={!editedScript.trim()}
            title="Continue to Video Prompts"
            className="fixed top-20 right-6 z-20 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}
    </div>  
  );
};

export default ScriptCreatePage;
