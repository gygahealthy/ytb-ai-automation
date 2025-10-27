import { ApiResponse } from "../../../../../shared/types";
import { Logger } from "../../../../../shared/utils/logger";
import { videoGenerationRepository } from "../../flow-veo3-apis/repository/video-generation.repository";
import { VideoGeneration } from "../../../../../shared/types/video-creation.types";
import { extractVideoMetadata } from "../../flow-veo3-apis/services/veo3-apis/veo3-video-creation.service";

const logger = new Logger("VEO3VideoHistoryService");

export interface VideoHistoryFilter {
  status?: "all" | "pending" | "processing" | "completed" | "failed";
  profileId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface PaginatedVideoHistory {
  items: VideoGeneration[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * VEO3 Video History Service
 *
 * Dedicated service for managing video generation history with efficient pagination,
 * filtering, and date-based queries for lazy loading.
 */
export class VEO3VideoHistoryService {
  /**
   * Get paginated video history with optional filtering
   */
  async getVideoHistory(
    page: number = 1,
    pageSize: number = 20,
    filter?: VideoHistoryFilter
  ): Promise<ApiResponse<PaginatedVideoHistory>> {
    try {
      logger.info(`Fetching video history: page=${page}, pageSize=${pageSize}`, filter);

      const offset = (page - 1) * pageSize;

      // Fetch generations based on filters
      let generations: VideoGeneration[];
      let total: number;

      if (filter?.profileId) {
        generations = await videoGenerationRepository.getByProfilePaginated(
          filter.profileId,
          pageSize,
          offset,
          filter.status !== "all" ? filter.status : undefined,
          filter.startDate,
          filter.endDate
        );
        total = await videoGenerationRepository.countByProfile(
          filter.profileId,
          filter.status !== "all" ? filter.status : undefined,
          filter.startDate,
          filter.endDate
        );
      } else if (filter?.status && filter.status !== "all") {
        generations = await videoGenerationRepository.getByStatusPaginated(
          filter.status,
          pageSize,
          offset,
          filter.startDate,
          filter.endDate
        );
        total = await videoGenerationRepository.countByStatus(filter.status, filter.startDate, filter.endDate);
      } else {
        generations = await videoGenerationRepository.getAllPaginated(pageSize, offset, filter?.startDate, filter?.endDate);
        total = await videoGenerationRepository.countAll(filter?.startDate, filter?.endDate);
      }

      // Enrich data: extract videoUrl from rawResponse if missing
      const enriched = this.enrichGenerations(generations);

      const hasMore = offset + generations.length < total;

      return {
        success: true,
        data: {
          items: enriched,
          total,
          page,
          pageSize,
          hasMore,
        },
      };
    } catch (error) {
      logger.error("Failed to fetch video history", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get video history grouped by date for UI display
   */
  async getVideoHistoryGroupedByDate(
    page: number = 1,
    pageSize: number = 20,
    filter?: VideoHistoryFilter
  ): Promise<
    ApiResponse<{
      groups: Array<{
        date: string;
        dateLabel: string; // "Today", "Yesterday", "Oct 10, 2025"
        items: VideoGeneration[];
      }>;
      total: number;
      page: number;
      pageSize: number;
      hasMore: boolean;
    }>
  > {
    try {
      const result = await this.getVideoHistory(page, pageSize, filter);

      if (!result.success || !result.data) {
        return { success: false, error: result.error };
      }

      const { items, total, hasMore } = result.data;

      // Group items by date
      const grouped = this.groupByDate(items);

      return {
        success: true,
        data: {
          groups: grouped,
          total,
          page,
          pageSize,
          hasMore,
        },
      };
    } catch (error) {
      logger.error("Failed to fetch grouped video history", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get status counts for all videos
   */
  async getStatusCounts(profileId?: string): Promise<
    ApiResponse<{
      all: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
    }>
  > {
    try {
      const counts = await videoGenerationRepository.getStatusCounts(profileId);

      return {
        success: true,
        data: {
          all: counts.total,
          pending: counts.pending,
          processing: counts.processing,
          completed: counts.completed,
          failed: counts.failed,
        },
      };
    } catch (error) {
      logger.error("Failed to fetch status counts", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Enrich generations by extracting videoUrl from rawResponse if missing
   */
  private enrichGenerations(generations: VideoGeneration[]): VideoGeneration[] {
    return generations.map((g) => {
      if (g.status === "completed" && !g.videoUrl && g.rawResponse) {
        try {
          const parsed = JSON.parse(g.rawResponse);
          const extracted = extractVideoMetadata(parsed);
          if (extracted.videoUrl) {
            g.videoUrl = extracted.videoUrl;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      return g;
    });
  }

  /**
   * Group video generations by date
   */
  private groupByDate(items: VideoGeneration[]): Array<{
    date: string;
    dateLabel: string;
    items: VideoGeneration[];
  }> {
    const groups = new Map<string, VideoGeneration[]>();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const item of items) {
      const createdDate = new Date(item.createdAt);
      const dateKey = createdDate.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(item);
    }

    // Convert to array and add labels
    const result: Array<{ date: string; dateLabel: string; items: VideoGeneration[] }> = [];

    for (const [dateKey, items] of groups.entries()) {
      const date = new Date(dateKey);
      let dateLabel: string;

      if (this.isSameDay(date, today)) {
        dateLabel = "Today";
      } else if (this.isSameDay(date, yesterday)) {
        dateLabel = "Yesterday";
      } else {
        dateLabel = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      }

      result.push({
        date: dateKey,
        dateLabel,
        items,
      });
    }

    // Sort by date descending
    result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth() && date1.getDate() === date2.getDate()
    );
  }
}

// Export singleton instance
export const veo3VideoHistoryService = new VEO3VideoHistoryService();
