const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const os = require("os");

const dbPath = path.join(os.homedir(), "AppData", "Roaming", "veo3-automation", "veo3-automation.db");

console.log(`Opening database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }

  console.log("\n=== All Component Prompt Configs ===");
  db.all(
    `
    SELECT 
      id,
      component_name,
      profile_id,
      prompt_id,
      ai_model,
      enabled,
      created_at
    FROM component_prompt_configs
    ORDER BY component_name
  `,
    (err, rows) => {
      if (err) {
        console.error("Error querying database:", err.message);
      } else {
        if (!rows || rows.length === 0) {
          console.log("No component configurations found!");
        } else {
          console.log(`Found ${rows.length} configurations:`);
          rows.forEach((row) => {
            console.log(`  - ${row.component_name} (promptId: ${row.prompt_id}, profileId: ${row.profile_id})`);
          });
        }
      }

      console.log("\n=== Searching for AITopicSuggestions ===");
      db.get(
        `
      SELECT 
        id,
        component_name,
        profile_id,
        prompt_id,
        ai_model,
        enabled
      FROM component_prompt_configs
      WHERE component_name = ?
    `,
        ["AITopicSuggestions"],
        (err, row) => {
          if (err) {
            console.error("Error querying database:", err.message);
          } else if (!row) {
            console.log("AITopicSuggestions: NOT FOUND");

            // Try fuzzy match
            db.all(
              `
          SELECT 
            id,
            component_name,
            profile_id,
            prompt_id
          FROM component_prompt_configs
          WHERE component_name LIKE ?
        `,
              ["%Topic%"],
              (err, fuzzyRows) => {
                if (err) {
                  console.error("Error with fuzzy search:", err.message);
                } else if (fuzzyRows && fuzzyRows.length > 0) {
                  console.log(`Found ${fuzzyRows.length} component(s) containing "Topic":`);
                  fuzzyRows.forEach((r) => {
                    console.log(`  - ${r.component_name} (promptId: ${r.prompt_id})`);
                  });
                } else {
                  console.log('No components containing "Topic" found');
                }

                db.close();
                process.exit(0);
              }
            );
          } else {
            console.log(`Found: ${row.component_name}`);
            console.log(`  - ID: ${row.id}`);
            console.log(`  - Profile ID: ${row.profile_id}`);
            console.log(`  - Prompt ID: ${row.prompt_id}`);
            console.log(`  - AI Model: ${row.ai_model}`);
            console.log(`  - Enabled: ${row.enabled}`);

            db.close();
            process.exit(0);
          }
        }
      );
    }
  );
});
