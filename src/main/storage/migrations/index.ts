import { Logger } from "../../../shared/utils/logger";
import type { SQLiteDatabase } from "../sqlite-database";
import { runMigrationsFromModules, Migration, getCurrentVersion } from "./runner";
import * as m001 from "./modules/001_add_user_agent_and_tags";
import * as m002 from "./modules/002_add_is_logged_in";
import * as m003 from "./modules/003_add_master_prompts";
import * as m004 from "./modules/004_migrate_profiles_from_local_db";
import * as m005 from "./modules/005_add_master_prompts_flags_and_tags";
import * as m006 from "./modules/006_add_prompt_history_table";
import * as m007 from "./modules/007_add_prompt_history_digest";
import * as m008 from "./modules/008_backfill_prompt_history_digest";
import * as m009 from "./modules/009_add_prompt_history_digest_short";
import * as m010 from "./modules/010_add_veo3_video_generations";
import * as m011 from "./modules/011_add_video_metadata_fields";
import * as m012 from "./modules/012_add_channel_id_to_master_prompts";
import * as m013 from "./modules/013_add_prompt_type_and_channel_support";
import * as m014 from "./modules/014_seed_master_prompt_types";
import * as m015 from "./modules/015_cleanup_duplicate_prompt_types";
import * as m016 from "./modules/016_add_type_code_and_status_to_prompt_types";
import * as m017 from "./modules/017_add_prompt_type_id_foreign_key";
import * as m018 from "./modules/018_restructure_master_prompts_table";
import * as m019 from "./modules/019_populate_master_prompt_types";
import * as m020 from "./modules/020_add_url_to_cookies";
import * as m021 from "./modules/021_add_component_prompt_configs";
import * as m022 from "./modules/022_add_variable_occurrences_config";
import * as m023 from "./modules/023_remove_gemini_token_column";
import * as m024 from "./modules/024_add_cookie_rotation_config_columns";
import * as m025 from "./modules/025_add_required_cookies_column";
import * as m026 from "./modules/026_add_video_upscales_table";
import * as m027 from "./modules/027_add_rotation_status_tracking";
import * as m028 from "./modules/028_relax_upscale_foreign_keys";
import * as m029 from "./modules/029_ensure_veo3_video_generation_columns";
import * as m030 from "./modules/030_fix_upscale_foreign_key_constraints";

const logger = new Logger("DatabaseMigrationsOrchestrator");

const modules: Migration[] = [
  m001,
  m002,
  m003,
  m004,
  m005,
  m006,
  m007,
  m008,
  m009,
  m010,
  m011,
  m012,
  m013,
  m014,
  m015,
  m016,
  m017,
  m018,
  m019,
  m020,
  m021,
  m022,
  m023,
  m024,
  m025,
  m026,
  m027,
  m028,
  m029,
  m030,
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  try {
    const version = await getCurrentVersion(db);
    logger.info(`Orchestrator starting. current version: ${version}`);
    await runMigrationsFromModules(db, modules);
    logger.info("All migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed", error);
    throw error;
  }
}
