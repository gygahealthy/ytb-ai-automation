import { useMemo } from "react";
import { useVideoCreationStore } from "@store/video-creation.store";

/**
 * Hook to handle filtering and sorting of prompts
 */
export function useVideoFilters() {
  const prompts = useVideoCreationStore((state) => state.prompts);
  const jobs = useVideoCreationStore((state) => state.jobs);
  const statusFilter = useVideoCreationStore((state) => state.statusFilter);
  const sortBy = useVideoCreationStore((state) => state.sortBy);

  /**
   * Filter and sort prompts based on status and sort preference
   */
  const filteredPrompts = useMemo(() => {
    return prompts
      .filter((prompt) => {
        if (statusFilter === "all") return true;

        const job = jobs.find((j) => j.promptId === prompt.id);

        if (statusFilter === "idle") {
          return !job; // No job exists for this prompt
        }

        return job?.status === statusFilter;
      })
      .sort((a, b) => {
        if (sortBy === "status") {
          // Sort by status priority
          const statusPriority: Record<string, number> = {
            failed: 1,
            processing: 2,
            completed: 3,
            idle: 4,
          };

          const jobA = jobs.find((j) => j.promptId === a.id);
          const jobB = jobs.find((j) => j.promptId === b.id);

          const statusA = jobA?.status || "idle";
          const statusB = jobB?.status || "idle";

          const priorityA = statusPriority[statusA] || 999;
          const priorityB = statusPriority[statusB] || 999;

          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          // Within same status, sort by array index
          return a.order - b.order;
        }

        // Sort by index (array order)
        return a.order - b.order;
      });
  }, [prompts, jobs, statusFilter, sortBy]);

  return {
    filteredPrompts,
  };
}
