import React, { useEffect } from "react";
import { Loader2, Video } from "lucide-react";
import { useVideoHistory } from "../../../contexts/VideoHistoryContext";
import GenerationCard from "./GenerationCard";

const VideoHistoryContent: React.FC = () => {
  const {
    dateGroups,
    loading,
    loadingMore,
    refreshingId,
    filter,
    globalPreview,
    hasMore,
    total,
    observerTarget,
    handleRefreshStatus,
    loadMoreVideos,
  } = useVideoHistory();

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreVideos();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  // Re-run when list size or load states change so the observer will attach to the
  // correct sentinel element if it moved (we render the sentinel earlier in the list).
  }, [hasMore, loading, loadingMore, loadMoreVideos, /* reattach when list changes */ total]);

  const totalItems = dateGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {loading && dateGroups.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : dateGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Video className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No videos found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter.status === "all" ? "Start creating videos to see them here" : `No ${filter.status} videos found`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Date Groups - Google Photos Style */}
          {
            // Render groups and inject the observer sentinel after a target number of items
            (() => {
              const triggerAfter = 10; // trigger earlier than the end (between 10-15)
              let cumIndex = 0;
              let sentinelInserted = false;

              const rendered = dateGroups.map((group) => (
                <div key={group.date} className="space-y-4">
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{group.dateLabel}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.items.length} video{group.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Videos Grid */}
                  <div className="grid gap-4">
                    {group.items.map((generation) => {
                      cumIndex += 1;
                      const item = (
                        <GenerationCard
                          key={generation.id}
                          generation={generation}
                          refreshingId={refreshingId}
                          onRefresh={handleRefreshStatus}
                          globalPreview={globalPreview}
                        />
                      );

                      // If we've reached the trigger index, render the sentinel after this item
                      if (!sentinelInserted && cumIndex === triggerAfter) {
                        sentinelInserted = true;
                        return (
                          <React.Fragment key={`frag-${generation.id}`}>
                            {item}
                            <div ref={observerTarget} className="h-4" key={`observer-sentinel-${generation.id}`} />
                          </React.Fragment>
                        );
                      }

                      return item;
                    })}
                  </div>
                </div>
              ));

              // If we didn't insert a sentinel (list shorter than trigger), return rendered and
              // let the fallback sentinel below render the observer target.
              // We still return the rendered groups here.
              return rendered;
            })()
          }

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading more videos...</span>
            </div>
          )}

      {/* Note: sentinel is injected earlier in the list (see above). If the list was too
        short to inject the sentinel, render a fallback sentinel here so the observer
        always has an element to attach to. */}
          { /* Fallback sentinel (rendered only when not replaced by injected sentinel) */ }
          <div ref={observerTarget} className="h-4" />

          {/* End of List */}
          {!hasMore && totalItems > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You've reached the end • {totalItems} of {total} videos loaded
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoHistoryContent;
