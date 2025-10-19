import React, { useState } from "react";
import { Users, Plus, ExternalLink, Trash2 } from "lucide-react";
import {
  ChannelCompetitor,
  CreateCompetitorInput,
} from "../../../../main/modules/channel-management/youtube.types";
import { addCompetitor, deleteCompetitor } from "../../../ipc/youtube";
import { formatNumber } from "../../../../shared/utils/formatters";

interface Props {
  channelId: string;
  competitors: ChannelCompetitor[];
  onUpdate: () => void;
}

const CompetitorTracking: React.FC<Props> = ({
  channelId,
  competitors,
  onUpdate,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [competitorName, setCompetitorName] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorChannelId, setCompetitorChannelId] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddCompetitor = async () => {
    if (
      !competitorName.trim() ||
      !competitorUrl.trim() ||
      !competitorChannelId.trim()
    )
      return;

    setSaving(true);
    try {
      const input: CreateCompetitorInput = {
        channelId,
        competitorChannelId,
        competitorName,
        competitorUrl,
      };
      const response = await addCompetitor(input);
      if (response.success) {
        setCompetitorName("");
        setCompetitorUrl("");
        setCompetitorChannelId("");
        setIsAdding(false);
        onUpdate();
      } else {
        alert(response.error || "Failed to add competitor");
      }
    } catch (err) {
      alert(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompetitor = async (id: string) => {
    if (!confirm("Remove this competitor?")) return;

    try {
      const response = await deleteCompetitor(id);
      if (response.success) {
        onUpdate();
      } else {
        alert(response.error || "Failed to delete competitor");
      }
    } catch (err) {
      alert(String(err));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl flex flex-col h-full">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-850 px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Competitor Tracking
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {competitors.length} competitors tracked
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group"
            title="Add competitor"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isAdding && (
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="Competitor name..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
            />
            <input
              type="text"
              value={competitorChannelId}
              onChange={(e) => setCompetitorChannelId(e.target.value)}
              placeholder="Channel ID..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
            />
            <input
              type="text"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="Channel URL..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 transition-all duration-200"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCompetitor}
                disabled={
                  saving || !competitorName.trim() || !competitorUrl.trim()
                }
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
              >
                {saving ? "Adding..." : "Add Competitor"}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setCompetitorName("");
                  setCompetitorUrl("");
                  setCompetitorChannelId("");
                }}
                className="px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {competitors.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
              No competitors tracked yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Click the + button to add your first competitor
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all duration-200 border border-gray-200 dark:border-gray-700 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <a
                      href={competitor.competitorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-2 group/link mb-2.5"
                    >
                      <span>{competitor.competitorName}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                    <div className="flex items-center gap-4 text-xs">
                      {competitor.subscriberCount && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <span>👥</span>
                          <span className="font-medium">
                            {formatNumber(competitor.subscriberCount)}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">
                            subs
                          </span>
                        </div>
                      )}
                      {competitor.avgViews && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <span>📊</span>
                          <span className="font-medium">
                            {formatNumber(competitor.avgViews)}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500">
                            avg
                          </span>
                        </div>
                      )}
                      {competitor.uploadFrequency && (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <span>📅</span>
                          <span className="font-medium">
                            {competitor.uploadFrequency}
                          </span>
                        </div>
                      )}
                    </div>
                    {competitor.notes && (
                      <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {competitor.notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCompetitor(competitor.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Remove competitor"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorTracking;
