import React, { useState } from "react";
import { Sparkles, ChevronRight, ChevronLeft, Edit3, Wand2, Layers, List } from "lucide-react";
import { TopicInput } from "../../components/video-creation/script-creation/TopicInput";
import { ScriptStyleSelector } from "../../components/video-creation/script-creation/ScriptStyleSelector";
import { VisualStyleSelector } from "../../components/video-creation/script-creation/VisualStyleSelector";
import { VideoPromptGenerator, VideoPrompt } from "../../components/video-creation/script-creation/VideoPromptGenerator";
import { useVideoCreation } from "../../contexts/VideoCreationContext";
import { useAlert } from "../../hooks/useAlert";
import { replaceTemplate } from "../../../shared/utils/template-replacement.util";

const electronApi = (window as any).electronAPI;

const ScriptCreatePage: React.FC = () => {
  const { show: showAlert } = useAlert();
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [numberOfTopics, setNumberOfTopics] = useState<number>(8);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState<boolean>(false);

  const {
    topic,
    selectedTopic,
    selectedTopicId,
    setTopic,
    setSelectedTopic,
    setSelectedTopicId,
    videoStyle,
    setVideoStyle,
    visualStyle,
    setVisualStyle,
    editedScript,
    setEditedScript,
    setVideoPrompts,
    scriptLengthPreset,
    setScriptLengthPreset,
    customWordCount,
    setCustomWordCount,
    currentStep,
    setCurrentStep,
    viewMode,
    setViewMode,
    isGenerating,
    setIsGenerating,
  } = useVideoCreation();

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
      // Directly call IPC to get config for AITopicSuggestions (like PromptPlaygroundPage does)
      console.log("[handleSuggestTopics] Fetching config directly from IPC");
      const configResponse = await electronApi.aiPrompt.getConfig("AITopicSuggestions");
      console.log("[handleSuggestTopics] Config response:", configResponse);

      if (!configResponse?.success || !configResponse.data) {
        console.error("AITopicSuggestions config not found:", configResponse?.error);
        // Fallback to mock suggestions
        const allMockSuggestions = [
          "Complete guide to creating engaging short form video content for social media platforms like TikTok Instagram and YouTube Shorts with trending formats and techniques",
          "How to start and grow a successful YouTube channel from zero subscribers including content strategy equipment setup and monetization methods for beginners",
          "Effective digital marketing strategies for small business success including social media SEO content marketing and email campaigns to boost sales and brand awareness",
          "Top productivity tools and apps for remote workers to improve efficiency collaboration task management and work life balance in distributed teams and environments",
        ];
        const selectedSuggestions = allMockSuggestions.slice(0, numberOfTopics);
        setTopicSuggestions(selectedSuggestions);
        return;
      }

      const config = configResponse.data;

      // Load the master prompt
      console.log("[handleSuggestTopics] Loading master prompt ID:", config.promptId);
      const promptResponse = await electronApi.masterPrompts.getById(config.promptId);
      console.log("[handleSuggestTopics] Master prompt response:", promptResponse);

      if (!promptResponse?.success || !promptResponse.data) {
        console.error("Failed to load master prompt, using mock data");
        // Fallback
        const allMockSuggestions = [
          `Video about ${topic} - Complete guide for beginners`,
          `How to master ${topic} - Tips and tricks`,
          `${topic} - Expert interview and insights`,
          `Top 10 things about ${topic}`,
        ];
        setTopicSuggestions(allMockSuggestions.slice(0, numberOfTopics));
        return;
      }

      const masterPrompt = promptResponse.data;
      const promptTemplate = masterPrompt.promptTemplate || masterPrompt.prompt || "";

      // Prepare variables for template replacement
      const variables = {
        user_input_keywords: topic,
        video_topic: topic,
        topic_hint: topic,
        number_of_topics: String(numberOfTopics),
      };

      // Replace template variables
      const processedPrompt = replaceTemplate(promptTemplate, variables, masterPrompt.variableOccurrencesConfig || undefined);

      // Call AI via backend
      const response = await electronApi.aiPrompt.callAI({
        componentName: config.componentName,
        profileId: config.profileId || "default",
        data: variables,
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

        // Parse the AI response to extract topics
        const topics = parseTopicsFromAIResponse(outputText, numberOfTopics);
        setTopicSuggestions(topics);
      } else {
        console.error("AI call failed:", response?.error);
        // Show user-friendly error alert with cookie refresh hint
        const errorMessage = response?.error || "Failed to generate topics";
        showAlert({
          title: "Topic Generation Failed",
          message: errorMessage,
          severity: "error",
        });
        // Fallback to mock suggestions
        const allMockSuggestions = [
          `Video about ${topic} - Complete guide for beginners`,
          `How to master ${topic} - Tips and tricks`,
          `${topic} - Expert interview and insights`,
          `Top 10 things about ${topic}`,
        ];
        setTopicSuggestions(allMockSuggestions.slice(0, numberOfTopics));
      }
    } catch (error) {
      console.error("Failed to generate topics:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      showAlert({
        title: "Error",
        message: `Failed to generate topics: ${errorMsg}`,
        severity: "error",
      });
      // Fallback to mock suggestions
      const allMockSuggestions = [
        `Video about ${topic} - Complete guide for beginners`,
        `How to master ${topic} - Tips and tricks`,
        `${topic} - Expert interview and insights`,
        `Top 10 things about ${topic}`,
      ];
      setTopicSuggestions(allMockSuggestions.slice(0, numberOfTopics));
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
    setTopicSuggestions([]);
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
      const configResponse = await electronApi.aiPrompt.getConfig("ScriptStyleSelector");
      if (!configResponse?.success || !configResponse.data) {
        throw new Error(configResponse?.error || "No configuration found for ScriptStyleSelector component");
      }

      const componentConfig = configResponse.data;
      const profileId = componentConfig.profileId || "default";

      // Call AI service with real parameters using the profile from config
      const response = await electronApi.aiPrompt.callAI({
        componentName: "VideoPromptGenerator",
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 z-10">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Story Generator</h1>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("step-by-step")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === "step-by-step"
                      ? "bg-white dark:bg-gray-800 text-blue-500 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Step-by-Step
                </button>
                <button
                  onClick={() => setViewMode("simple")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    viewMode === "simple"
                      ? "bg-white dark:bg-gray-800 text-blue-500 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Simple
                </button>
              </div>

              {/* Step Navigation - Only show in step-by-step mode */}
              {viewMode === "step-by-step" && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    disabled={currentStep === 1}
                    className={`flex items-center gap-2 transition-all ${currentStep >= 1 ? "text-blue-500" : "text-gray-400"} ${
                      currentStep === 1 ? "cursor-default" : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 1 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      1
                    </div>
                    <span className="text-sm font-medium">Topic & Style</span>
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => currentStep >= 2 && setCurrentStep(2)}
                    disabled={currentStep < 2}
                    className={`flex items-center gap-2 transition-all ${currentStep >= 2 ? "text-blue-500" : "text-gray-400"} ${
                      currentStep < 2
                        ? "cursor-not-allowed"
                        : currentStep === 2
                        ? "cursor-default"
                        : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 2 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      2
                    </div>
                    <span className="text-sm font-medium">Edit Script & Visual Style</span>
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => currentStep >= 3 && setCurrentStep(3)}
                    disabled={currentStep < 3}
                    className={`flex items-center gap-2 transition-all ${currentStep >= 3 ? "text-blue-500" : "text-gray-400"} ${
                      currentStep < 3 ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 3 ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      3
                    </div>
                    <span className="text-sm font-medium">Generate Prompts</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {/* Step-by-Step Mode */}
        {viewMode === "step-by-step" && (
          <>
            {currentStep === 1 && (
              <div className="h-full overflow-auto px-6 py-8">
                <div className="space-y-6 animate-fadeIn">
                  <TopicInput
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
                  />
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <ScriptStyleSelector
                      selectedStyle={videoStyle}
                      onStyleChange={setVideoStyle}
                      scriptLengthPreset={scriptLengthPreset}
                      onScriptLengthChange={setScriptLengthPreset}
                      customWordCount={customWordCount}
                      onCustomWordCountChange={setCustomWordCount}
                    />
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How It Works</h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p>
                        <strong>1.</strong> Enter your video topic or idea (just a few words is enough)
                      </p>
                      <p>
                        <strong>2.</strong> Choose a tone/style that matches your content
                      </p>
                      <p>
                        <strong>3.</strong> AI generates a complete script divided into scenes
                      </p>
                      <p>
                        <strong>4.</strong> Edit the script and choose visual style for the video
                      </p>
                      <p>
                        <strong>5.</strong> Generate 8-second video prompts optimized for your chosen styles
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="h-full overflow-auto px-6 py-8">
                <div className="space-y-6 animate-fadeIn">
                  {/* Script Editor */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Edit3 className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review & Edit Script</h2>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Review the generated script and make any edits if necessary. The script is divided into 8 scenes for optimal
                      video creation.
                    </p>
                    <textarea
                      value={editedScript}
                      onChange={(e) => setEditedScript(e.target.value)}
                      className="w-full h-96 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Your generated script will appear here..."
                    />
                  </div>

                  {/* Visual Style Selector */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Choose Visual/Artistic Style</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Select the artistic style that will be used to generate the visual prompts for your video. This determines
                      the look and feel of your final video.
                    </p>
                    <VisualStyleSelector selectedStyle={visualStyle} onStyleChange={setVisualStyle} />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
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
                  onScriptLengthChange={setScriptLengthPreset}
                  onCustomWordCountChange={setCustomWordCount}
                  onTopicChange={setTopic}
                  onVideoStyleChange={setVideoStyle}
                  onVisualStyleChange={setVisualStyle}
                  onScriptChange={setEditedScript}
                />
              </div>
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
