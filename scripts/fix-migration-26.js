/**
 * Script to fix migration 26 - force re-run by removing it from schema_migrations
 * Run this with: node scripts/fix-migration-26.js
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

async function fixMigration() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Check if rotation_profiles table exists
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='rotation_profiles'", (err, row) => {
        if (err) {
          console.error("Error checking for rotation_profiles table:", err);
          reject(err);
          return;
        }

        if (row) {
          console.log("✅ rotation_profiles table already exists");
          resolve();
          return;
        }

        console.log("❌ rotation_profiles table does NOT exist");
        console.log("Removing migration 26 from schema_migrations to force re-run...");

        // Remove migration 26 from schema_migrations
        db.run("DELETE FROM schema_migrations WHERE version = 26", function (err) {
          if (err) {
            console.error("Error removing migration 26:", err);
            reject(err);
            return;
          }

          if (this.changes > 0) {
            console.log("✅ Migration 26 removed from schema_migrations");
            console.log("🔄 Please restart the app to re-run the migration");
          } else {
            console.log("ℹ️  Migration 26 was not in schema_migrations");
          }

          resolve();
        });
      });
    });
  });
}

fixMigration()
  .then(() => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      }
      console.log("Done!");
    });
  })
  .catch((err) => {
    console.error("Failed:", err);
    db.close();
    process.exit(1);
  });
