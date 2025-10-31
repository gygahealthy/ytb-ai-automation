import { Logger } from "../../../../shared/utils/logger";
import type { SQLiteDatabase } from "../../sqlite-database";

const logger = new Logger("Migration035");

export const version = 35;
export const description = "Add generation_type and image_references columns to veo3_video_generations";

/**
 * Migration 035: Add generation_type and image_references columns
 *
 * Adds support for different video generation types:
 * - text-to-video: Traditional text prompt generation
 * - image-reference: Generate video from up to 3 reference images
 * - image-start-end: Generate video with start and end frame images
 * - scene-builder: Generate video using scene builder tool
 *
 * Also adds image_references column to store JSON array of image generation IDs
 */
export async function up(db: SQLiteDatabase, migrationLogger?: Logger): Promise<void> {
  const log = migrationLogger || logger;

  log.info("Starting migration 035: Add generation_type and image_references columns");

  try {
    // Check if columns already exist
    const columns = await db.all("PRAGMA table_info(veo3_video_generations)");
    const hasGenerationType = columns.some((c: any) => c.name === "generation_type");
    const hasImageReferences = columns.some((c: any) => c.name === "image_references");

    if (!hasGenerationType) {
      log.info("Adding generation_type column to veo3_video_generations");
      await db.run(
        `ALTER TABLE veo3_video_generations 
         ADD COLUMN generation_type TEXT DEFAULT 'text-to-video'`
      );
      log.info("✓ Added generation_type column");
    } else {
      log.info("generation_type column already exists, skipping");
    }

    if (!hasImageReferences) {
      log.info("Adding image_references column to veo3_video_generations");
      await db.run(
        `ALTER TABLE veo3_video_generations 
         ADD COLUMN image_references TEXT`
      );
      log.info("✓ Added image_references column (stores JSON array of image IDs)");
    } else {
      log.info("image_references column already exists, skipping");
    }

    // Create index for generation_type for efficient filtering
    if (!hasGenerationType) {
      log.info("Creating index on generation_type");
      await db.run(
        `CREATE INDEX IF NOT EXISTS idx_veo3_video_generations_type 
         ON veo3_video_generations(generation_type)`
      );
      log.info("✓ Created index on generation_type");
    }

    log.info("Migration 035 completed successfully");
  } catch (error) {
    log.error("Migration 035 failed", error);
    throw error;
  }
}
