/**
 * Script to check migration status and fix migration 26 for veo3_video_upscales
 * Run this with: node scripts/check-migrations.js
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const os = require("os");

const APP_FOLDER_NAME = "veo3-automation";
const dbPath = path.join(os.homedir(), "AppData", "Roaming", APP_FOLDER_NAME, "veo3-automation.db");

console.log(`Opening database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to open database:", err);
    process.exit(1);
  }
});

async function checkAndFixMigrations() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log("\n=== Checking Migration Status ===\n");

      // Check current migration version
      db.get("SELECT MAX(version) as current_version FROM schema_migrations", (err, row) => {
        if (err) {
          console.error("Error checking migration version:", err);
          reject(err);
          return;
        }

        const currentVersion = row?.current_version || 0;
        console.log(`📊 Current migration version: ${currentVersion}`);

        // Check if migration 26 has been applied
        db.get("SELECT version FROM schema_migrations WHERE version = 26", (err, migration26) => {
          if (err) {
            console.error("Error checking migration 26:", err);
            reject(err);
            return;
          }

          // Check if veo3_video_upscales table exists
          db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='veo3_video_upscales'", (err, table) => {
            if (err) {
              console.error("Error checking for veo3_video_upscales table:", err);
              reject(err);
              return;
            }

            console.log(`\n=== Migration 26 Status ===`);
            console.log(`Migration 26 in schema_migrations: ${migration26 ? "✅ YES" : "❌ NO"}`);
            console.log(`veo3_video_upscales table exists: ${table ? "✅ YES" : "❌ NO"}`);

            // If migration 26 is marked as applied but table doesn't exist, fix it
            if (migration26 && !table) {
              console.log("\n⚠️  INCONSISTENCY DETECTED!");
              console.log("Migration 26 is marked as applied but table doesn't exist.");
              console.log("Removing migration 26 from schema_migrations to force re-run...\n");

              db.run("DELETE FROM schema_migrations WHERE version = 26", function (err) {
                if (err) {
                  console.error("Error removing migration 26:", err);
                  reject(err);
                  return;
                }

                console.log("✅ Migration 26 removed from schema_migrations");
                console.log("🔄 Please restart the app to re-run migration 26");
                resolve();
              });
            } else if (!migration26 && !table) {
              console.log("\n✅ Migration 26 will run on next app start");
              resolve();
            } else if (table) {
              console.log("\n✅ Everything looks good! Table exists and migration is applied.");
              resolve();
            } else {
              console.log("\n✅ No action needed");
              resolve();
            }
          });
        });
      });
    });
  });
}

checkAndFixMigrations()
  .then(() => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      }
      console.log("\n✅ Done!\n");
    });
  })
  .catch((err) => {
    console.error("Failed:", err);
    db.close();
    process.exit(1);
  });
