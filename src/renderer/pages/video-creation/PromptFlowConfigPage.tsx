import { Copy, Edit2, Play, Plus, Search, Settings, Trash2, Workflow } from "lucide-react";
import { useState } from "react";

interface FlowStep {
  id: string;
  type: "prompt" | "api" | "condition" | "loop";
  name: string;
  config: Record<string, unknown>;
  order: number;
}

interface PromptFlow {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  category: string;
  isActive: boolean;
  createdAt: string;
  lastModified: string;
}

export default function PromptFlowConfigPage() {
  const [flows] = useState<PromptFlow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFlow, setSelectedFlow] = useState<PromptFlow | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "image-generation", "video-generation", "audio-generation", "text-processing"];

  const filteredFlows = flows.filter((flow) => {
    const matchesSearch =
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || flow.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prompt Flow Config</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create and manage automated workflows for video resource generation
            </p>
          </div>
          <button
            onClick={() => {
              /* TODO: Open create flow modal */
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Flow</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search flows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Flow List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredFlows.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Workflow className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {flows.length === 0 ? "No flows yet" : "No flows found"}
                </h3>
                <p className="text-gray-500 dark:text-gray-500 mb-6">
                  {flows.length === 0
                    ? "Create your first prompt flow to automate video resource generation"
                    : "Try adjusting your search or filters"}
                </p>
                {flows.length === 0 && (
                  <button
                    onClick={() => {
                      /* TODO: Open create flow modal */
                    }}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Create First Flow
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedFlow(flow)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Workflow className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{flow.name}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{flow.category.replace("-", " ")}</span>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        flow.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {flow.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{flow.description}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {flow.steps.length} step{flow.steps.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Test flow
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Test flow"
                      >
                        <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Duplicate flow
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Edit flow
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Delete flow
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flow Details Sidebar */}
        {selectedFlow && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Flow Details</h3>
                <button
                  onClick={() => setSelectedFlow(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{selectedFlow.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedFlow.description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Flow Steps</h4>
                  <div className="space-y-3">
                    {selectedFlow.steps.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No steps configured</p>
                    ) : (
                      selectedFlow.steps.map((step, idx) => (
                        <div key={step.id} className="relative">
                          {idx !== selectedFlow.steps.length - 1 && (
                            <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className="flex items-start gap-3 relative">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-semibold text-sm z-10 bg-white dark:bg-gray-800">
                              {idx + 1}
                            </div>
                            <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Settings className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-sm text-gray-900 dark:text-white">{step.name}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Type: {step.type}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Metadata</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selectedFlow.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Modified:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(selectedFlow.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="text-gray-900 dark:text-white">{selectedFlow.category.replace("-", " ")}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                    Edit Flow
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                    Test Flow
                  </button>
                  <button className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors">
                    Delete Flow
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
