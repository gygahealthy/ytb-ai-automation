import { videoGenerationRepository } from "../repository/video-generation.repository";
import { videoDownloadByNameService } from "../../../common/video-download/services/video-download-name.service";
import { videoDownloadService } from "../../../common/video-download/services/video-download.service";

/**
 * Video Download Event Listener Service
 *
 * Listens for download completion events from the video-download module
 * and updates the video_path in the video_generations table.
 *
 * This service maintains separation of concerns - the download module
 * doesn't need to know about video generation database structure.
 */
export class VideoDownloadEventListenerService {
  private initialized = false;

  /**
   * Initialize the event listener
   */
  initialize(): void {
    if (this.initialized) {
      console.log("[VideoDownloadEventListenerService] Already initialized, skipping");
      return;
    }

    // Register callback with the name-based download service (downloads by media generation ID)
    videoDownloadByNameService.setDownloadCompletedCallback(async (mediaGenerationId: string, localFilePath: string) => {
      await this.handleDownloadCompletedByName(mediaGenerationId, localFilePath);
    });

    // Register callback with the URL-based download service (downloads by video URL)
    videoDownloadService.setDownloadCompletedCallback(async (videoUrl: string, localFilePath: string) => {
      await this.handleDownloadCompletedByUrl(videoUrl, localFilePath);
    });

    this.initialized = true;
    console.log("[VideoDownloadEventListenerService] Initialized and registered callbacks with both download services");
  }

  /**
   * Handle download completed event by media generation ID (from videoDownloadByNameService)
   */
  private async handleDownloadCompletedByName(mediaGenerationId: string, localFilePath: string): Promise<void> {
    try {
      console.log(
        `[VideoDownloadEventListenerService] Received download completed event for mediaGenerationId: ${mediaGenerationId}`
      );

      // Find the video generation by mediaGenerationId
      const generation = await videoGenerationRepository.getByMediaGenerationId(mediaGenerationId);

      if (!generation) {
        console.warn(
          `[VideoDownloadEventListenerService] Video generation not found for mediaGenerationId: ${mediaGenerationId}`
        );
        return;
      }

      // Update the video_path
      await videoGenerationRepository.updateVideoPath(generation.id, localFilePath);

      console.log(`[VideoDownloadEventListenerService] Updated video_path for generation ${generation.id}: ${localFilePath}`);
    } catch (error) {
      console.error("[VideoDownloadEventListenerService] Error handling download completed event by name:", error);
    }
  }

  /**
   * Handle download completed event by video URL (from videoDownloadService)
   */
  private async handleDownloadCompletedByUrl(videoUrl: string, localFilePath: string): Promise<void> {
    try {
      console.log(`[VideoDownloadEventListenerService] Received download completed event for videoUrl: ${videoUrl}`);

      // Find the video generation by videoUrl
      const generation = await videoGenerationRepository.getByVideoUrl(videoUrl);

      if (!generation) {
        console.warn(`[VideoDownloadEventListenerService] Video generation not found for videoUrl: ${videoUrl}`);
        return;
      }

      // Update the video_path
      await videoGenerationRepository.updateVideoPath(generation.id, localFilePath);

      console.log(`[VideoDownloadEventListenerService] Updated video_path for generation ${generation.id}: ${localFilePath}`);
    } catch (error) {
      console.error("[VideoDownloadEventListenerService] Error handling download completed event by URL:", error);
    }
  }
}

// Export singleton instance
let _videoDownloadEventListenerServiceInstance: VideoDownloadEventListenerService | null = null;

function getVideoDownloadEventListenerService(): VideoDownloadEventListenerService {
  if (!_videoDownloadEventListenerServiceInstance) {
    _videoDownloadEventListenerServiceInstance = new VideoDownloadEventListenerService();
  }
  return _videoDownloadEventListenerServiceInstance;
}

export const videoDownloadEventListenerService = new Proxy({} as VideoDownloadEventListenerService, {
  get(_target, prop) {
    return getVideoDownloadEventListenerService()[prop as keyof VideoDownloadEventListenerService];
  },
});
