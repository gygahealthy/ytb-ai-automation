import { videoGenerationRepository } from "../repository/video-generation.repository";
import { videoDownloadByNameService } from "../../../common/video-download/services/video-download-name.service";

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

    // Register callback with the download service
    videoDownloadByNameService.setDownloadCompletedCallback(async (mediaGenerationId: string, localFilePath: string) => {
      await this.handleDownloadCompleted(mediaGenerationId, localFilePath);
    });

    this.initialized = true;
    console.log("[VideoDownloadEventListenerService] Initialized and registered callback with download service");
  }

  /**
   * Handle download completed event
   */
  private async handleDownloadCompleted(mediaGenerationId: string, localFilePath: string): Promise<void> {
    try {
      console.log(`[VideoDownloadEventListenerService] Received download completed event for ${mediaGenerationId}`);

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
      console.error("[VideoDownloadEventListenerService] Error handling download completed event:", error);
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
