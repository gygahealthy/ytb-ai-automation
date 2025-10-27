#!/usr/bin/env node

/**
 * Sync Media Generation IDs Script
 *
 * This script extracts mediaGenerationId from stored raw_response JSON
 * and syncs it back to the media_generation_id column for records that
 * have a raw_response but null media_generation_id.
 *
 * The database is stored in the user's appData folder at:
 * %APPDATA%/veo3-automation/veo3-automation.db (Windows)
 * ~/Library/Application Support/veo3-automation/veo3-automation.db (macOS)
 * ~/.config/veo3-automation/veo3-automation.db (Linux)
 *
 * Usage: node scripts/sync-media-generation-ids.js
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const os = require("os");

// Determine the app data path based on OS
let appDataPath;
if (process.platform === "win32") {
  appDataPath = process.env.APPDATA;
} else if (process.platform === "darwin") {
  appDataPath = path.join(os.homedir(), "Library", "Application Support");
} else {
  appDataPath = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
}

// Database path - matches the Electron app's database location
const DB_PATH = path.join(appDataPath, "veo3-automation", "veo3-automation.db");

console.log(`📂 Database path: ${DB_PATH}\n`);

if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Database not found at: ${DB_PATH}`);
  console.error("   Please ensure the app has been run at least once to create the database.");
  process.exit(1);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
    process.exit(1);
  }

  console.log("✅ Connected to database");
  console.log("🔍 Scanning for records with raw_response but null media_generation_id...\n");

  // Find records that need syncing
  db.all(
    `
    SELECT id, raw_response 
    FROM veo3_video_generations 
    WHERE raw_response IS NOT NULL 
    AND media_generation_id IS NULL 
    LIMIT 1000
  `,
    (err, rows) => {
      if (err) {
        console.error("❌ Error querying database:", err.message);
        db.close();
        process.exit(1);
      }

      const recordsToSync = rows || [];

      if (recordsToSync.length === 0) {
        console.log("✅ All records are up to date! No syncing needed.");
        db.close();
        process.exit(0);
      }

      console.log(`Found ${recordsToSync.length} records to sync:\n`);

      let synced = 0;
      let failed = 0;
      let skipped = 0;
      let processed = 0;

      console.log("Starting sync process...\n");
      console.log("--------------------------------------------------");
      console.log();

      // Process each record
      for (const record of recordsToSync) {
        try {
          const rawData = JSON.parse(record.raw_response);

          // Handle both types of responses:
          // Type 1: Direct response { operations: [ { mediaGenerationId: "...", operation: { metadata: { video: { mediaGenerationId: "..." } } } } ] }
          // Type 2: Wrapped response { raw: { operations: [ { mediaGenerationId: "...", operation: { metadata: { video: { mediaGenerationId: "..." } } } } ] } }
          const operationsArray = rawData?.operations || rawData?.raw?.operations;
          const operation = operationsArray?.[0];

          if (!operation) {
            console.log(`⏭️  Skipped: ${record.id.substring(0, 8)}... (no operations array in response)`);
            skipped++;
            processed++;
            continue;
          }

          // Extract mediaGenerationId from multiple possible locations (in priority order):
          // 1. operation.mediaGenerationId (top-level property in operations[0])
          // 2. operation.operation.metadata.video.mediaGenerationId (nested in metadata)
          const mediaGenerationId = operation?.mediaGenerationId || operation?.operation?.metadata?.video?.mediaGenerationId;

          if (mediaGenerationId) {
            // Update the database record
            db.run(
              `
              UPDATE veo3_video_generations 
              SET media_generation_id = ?, updated_at = ?
              WHERE id = ?
            `,
              [mediaGenerationId, new Date().toISOString(), record.id],
              (updateErr) => {
                if (updateErr) {
                  console.error(`❌ Failed to update: ${record.id.substring(0, 8)}... - ${updateErr.message}`);
                  failed++;
                } else {
                  console.log(`✅ Synced: ${record.id.substring(0, 8)}... -> ${mediaGenerationId.substring(0, 30)}...`);
                  synced++;
                }

                processed++;

                // When all records are processed, show summary
                if (processed === recordsToSync.length) {
                  showSummary();
                }
              }
            );
          } else {
            console.log(`⏭️  Skipped: ${record.id.substring(0, 8)}... (no mediaGenerationId found in either location)`);
            skipped++;
            processed++;

            // When all records are processed, show summary
            if (processed === recordsToSync.length) {
              showSummary();
            }
          }
        } catch (error) {
          console.error(`❌ Failed to parse: ${record.id.substring(0, 8)}... - ${error.message}`);
          failed++;
          processed++;

          // When all records are processed, show summary
          if (processed === recordsToSync.length) {
            showSummary();
          }
        }
      }

      function showSummary() {
        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Synced:  ${synced}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Failed:  ${failed}`);
        console.log(`   📈 Total:   ${recordsToSync.length}`);

        if (synced > 0) {
          console.log(`\n🎉 Successfully synced ${synced} media generation IDs!`);
        }

        db.close();
        process.exit(failed > 0 ? 1 : 0);
      }
    }
  );
});

db.on("error", (err) => {
  console.error("❌ Database error:", err.message);
  process.exit(1);
});
