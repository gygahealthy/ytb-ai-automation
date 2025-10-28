/**
 * Script to force migration 26 to run
 * This script resets the migration version to 25 so that 26 will run on next start
 * Run this with: node scripts/force-migration-26.js
 */

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const os = require("os");

const APP_FOLDER_NAME = "veo3-automation";
const dbPath = path.join(os.homedir(), "AppData", "Roaming", APP_FOLDER_NAME, "veo3-automation.db");

console.log(`Opening database at: ${dbPath}\n`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to open database:", err);
    process.exit(1);
  }
});

async function forceMigration26() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check current state
      db.get("SELECT MAX(version) as max_version FROM schema_migrations", (err, row) => {
        if (err) {
          console.error("Error checking max version:", err);
          reject(err);
          return;
        }

        const maxVersion = row?.max_version || 0;
        console.log(`📊 Current max migration version: ${maxVersion}`);

        // Check if migration 26 exists
        db.get("SELECT version FROM schema_migrations WHERE version = 26", (err, migration26) => {
          if (err) {
            console.error("Error checking migration 26:", err);
            reject(err);
            return;
          }

          console.log(`Migration 26 in schema_migrations: ${migration26 ? "✅ YES" : "❌ NO"}`);

          // Check if table exists
          db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='veo3_video_upscales'", (err, table) => {
            if (err) {
              console.error("Error checking table:", err);
              reject(err);
              return;
            }

            console.log(`veo3_video_upscales table exists: ${table ? "✅ YES" : "❌ NO"}\n`);

            // If table exists and migration 26 is not in schema_migrations, just add it
            if (table && !migration26) {
              console.log("✅ Table exists but migration not recorded.");
              console.log("Recording migration 26 in schema_migrations...\n");

              db.run(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                [26, new Date().toISOString()],
                function (err) {
                  if (err) {
                    console.error("Error recording migration 26:", err);
                    reject(err);
                    return;
                  }

                  console.log("✅ Migration 26 recorded in schema_migrations");
                  resolve();
                }
              );
              return;
            }

            // If table doesn't exist, reset version to 25 to force migration 26 to run
            if (!table) {
              console.log("❌ Table does NOT exist. Resetting to enable migration 26 to run...\n");

              // Delete migrations 26 and 27 from schema_migrations so they will run again
              db.run("DELETE FROM schema_migrations WHERE version IN (26, 27)", function (err) {
                if (err) {
                  console.error("Error deleting migrations:", err);
                  reject(err);
                  return;
                }

                console.log("✅ Deleted migrations 26 and 27 from schema_migrations");
                console.log("🔄 Next app start will execute both migrations\n");
                resolve();
              });
            } else {
              console.log("✅ Everything looks good!");
              resolve();
            }
          });
        });
      });
    });
  });
}

forceMigration26()
  .then(() => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      }
      console.log("✅ Done! Please restart the app to run migration 26.\n");
    });
  })
  .catch((err) => {
    console.error("Failed:", err);
    db.close();
    process.exit(1);
  });
