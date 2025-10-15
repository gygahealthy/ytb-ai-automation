import React from "react";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Wand2,
  Layers,
  List,
} from "lucide-react";
import { TopicInput } from "../../components/video-creation/script-creation/TopicInput";
import { ScriptStyleSelector } from "../../components/video-creation/script-creation/ScriptStyleSelector";
import { VisualStyleSelector } from "../../components/video-creation/script-creation/VisualStyleSelector";
import {
  VideoPromptGenerator,
  VideoPrompt,
} from "../../components/video-creation/script-creation/VideoPromptGenerator";
import { useVideoCreation } from "../../contexts/VideoCreationContext";

const ScriptCreatePage: React.FC = () => {
  const {
    topic,
    setTopic,
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

  const handleSuggestTopics = () => {
    alert("AI topic suggestions will be implemented");
  };

  const handleGenerateScript = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first");
      return;
    }
    setIsGenerating(true);
    // TODO: Replace with actual IPC call to backend AI service
    setTimeout(() => {
      const mockScript = `# ${topic}\n\n## Scene 1: Introduction\nWelcome to this video about ${topic}. Let's explore what makes this topic fascinating.\n\n## Scene 2: Background\nTo understand ${topic}, we need to look at its origins and key concepts.\n\n## Scene 3: Main Content\nHere are the core ideas you need to know about ${topic}.\n\n## Scene 4: Practical Examples\nLet's see how ${topic} applies in real-world scenarios.\n\n## Scene 5: Benefits\nWhy is ${topic} important? Here are the key advantages.\n\n## Scene 6: Common Misconceptions\nMany people misunderstand ${topic}. Let's clear up some myths.\n\n## Scene 7: Getting Started\nReady to dive deeper? Here's how you can begin with ${topic}.\n\n## Scene 8: Conclusion\nThat's your complete guide to ${topic}. Start applying these insights today!`;
      setEditedScript(mockScript);
      setIsGenerating(false);
      setCurrentStep(2);
    }, 2000);
  };

  const handleContinueToPrompts = () => {
    if (!editedScript.trim()) {
      alert("Please review or edit the script first");
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Story Generator
              </h1>
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
                    className={`flex items-center gap-2 transition-all ${
                      currentStep >= 1 ? "text-blue-500" : "text-gray-400"
                    } ${
                      currentStep === 1
                        ? "cursor-default"
                        : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 1
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700"
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
                    className={`flex items-center gap-2 transition-all ${
                      currentStep >= 2 ? "text-blue-500" : "text-gray-400"
                    } ${
                      currentStep < 2
                        ? "cursor-not-allowed"
                        : currentStep === 2
                        ? "cursor-default"
                        : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 2
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      2
                    </div>
                    <span className="text-sm font-medium">
                      Edit Script & Visual Style
                    </span>
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => currentStep >= 3 && setCurrentStep(3)}
                    disabled={currentStep < 3}
                    className={`flex items-center gap-2 transition-all ${
                      currentStep >= 3 ? "text-blue-500" : "text-gray-400"
                    } ${
                      currentStep < 3
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 3
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      3
                    </div>
                    <span className="text-sm font-medium">
                      Generate Prompts
                    </span>
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
                    onSuggestTopics={handleSuggestTopics}
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How It Works
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <p>
                        <strong>1.</strong> Enter your video topic or idea (just
                        a few words is enough)
                      </p>
                      <p>
                        <strong>2.</strong> Choose a tone/style that matches
                        your content
                      </p>
                      <p>
                        <strong>3.</strong> AI generates a complete script
                        divided into scenes
                      </p>
                      <p>
                        <strong>4.</strong> Edit the script and choose visual
                        style for the video
                      </p>
                      <p>
                        <strong>5.</strong> Generate 8-second video prompts
                        optimized for your chosen styles
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Review & Edit Script
                        </h2>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Review the generated script and make any edits if
                      necessary. The script is divided into 8 scenes for optimal
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
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Choose Visual/Artistic Style
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      Select the artistic style that will be used to generate
                      the visual prompts for your video. This determines the
                      look and feel of your final video.
                    </p>
                    <VisualStyleSelector
                      selectedStyle={visualStyle}
                      onStyleChange={setVisualStyle}
                    />
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
