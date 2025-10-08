#!/usr/bin/env node
/*
 Simple migration script to copy the `profiles` table from a legacy DB to a target DB.
 Usage:
   node scripts/migrate-profiles.js --source ./data/veo3-automation.db --target "C:\Users\You\AppData\Roaming\YourApp\veo3-automation.db" [--backup]

 If --target is omitted the script will attempt to guess a target under %APPDATA% (Windows) or $HOME/.config (Linux/macOS)
*/

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--source' && args[i+1]) { opts.source = args[++i]; }
    else if (a === '--target' && args[i+1]) { opts.target = args[++i]; }
    else if (a === '--backup') { opts.backup = true; }
    else if (a === '--help' || a === '-h') { opts.help = true; }
  }
  return opts;
}

function guessTargetPath() {
  // Try common app data locations
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || '.', 'AppData', 'Roaming');
    const APP_FOLDER_NAME = 'veo3-automation';
    // Use canonical `veo3-automation` folder under %APPDATA%
    const candidates = [
      path.join(appData, APP_FOLDER_NAME, 'veo3-automation.db'),
      path.join(appData, 'VEO3 AUTO', 'veo3-automation.db'),
      path.join(appData, 'VEO3-AUTO', 'veo3-automation.db'),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    // fallback to the first candidate
    return candidates[0];
  } else {
    const home = process.env.HOME || process.env.USERPROFILE || '.';
    const APP_FOLDER_NAME = 'veo3-automation';
    const candidates = [
      path.join(home, '.config', APP_FOLDER_NAME, 'veo3-automation.db'),
      path.join(home, '.config', 'veo3-automation.db'),
      path.join(home, 'Library', 'Application Support', APP_FOLDER_NAME, 'veo3-automation.db'),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return candidates[0];
  }
}

async function run() {
  const opts = parseArgs();
  if (opts.help) {
    console.log('Usage: node scripts/migrate-profiles.js --source <legacy-db> --target <target-db> [--backup]');
    process.exit(0);
  }

  const sourcePath = path.resolve(opts.source || path.join(process.cwd(), 'data', 'veo3-automation.db'));
  let targetPath = opts.target ? path.resolve(opts.target) : guessTargetPath();

  console.log('Source DB:', sourcePath);
  console.log('Target DB:', targetPath);

  if (!fs.existsSync(sourcePath)) {
    console.error('Source DB not found:', sourcePath);
    process.exit(1);
  }

  if (!fs.existsSync(targetPath)) {
    console.warn('Target DB does not exist yet. It will be created when opening it.');
  }

  // Ensure target directory exists so sqlite can create the DB file
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('Created target directory:', targetDir);
  }

  if (opts.backup && fs.existsSync(targetPath)) {
    const bak = targetPath + '.bak-' + Date.now();
    fs.copyFileSync(targetPath, bak);
    console.log('Backed up target DB to', bak);
  }

  const legacyDb = new sqlite3.Database(sourcePath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error('Failed to open source DB:', err);
      process.exit(1);
    }
  });

  const targetDb = new sqlite3.Database(targetPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error('Failed to open target DB:', err);
      process.exit(1);
    }
  });

  // Ensure profiles table exists in target DB so SELECT/INSERT won't fail
  const ensureProfilesTable = () => new Promise((resolve, reject) => {
    const createSql = `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      browser_path TEXT,
      user_data_dir TEXT NOT NULL,
      user_agent TEXT,
      proxy_server TEXT,
      proxy_username TEXT,
      proxy_password TEXT,
      credit_remaining REAL DEFAULT 0,
      tags TEXT,
      cookies TEXT,
      cookie_expires TEXT,
      is_logged_in INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`;
    targetDb.run(createSql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  await ensureProfilesTable();

  // Wrap in promises
  const allRows = () => new Promise((resolve, reject) => {
    legacyDb.all('SELECT * FROM profiles', (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });

  const getExists = (id) => new Promise((resolve, reject) => {
    targetDb.get('SELECT id FROM profiles WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row && row.id);
    });
  });

  const insertProfile = (row) => new Promise((resolve, reject) => {
    const stmt = `INSERT OR IGNORE INTO profiles (
      id, name, browser_path, user_data_dir, user_agent, proxy_server, proxy_username, proxy_password,
      credit_remaining, tags, cookies, cookie_expires, is_logged_in, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    targetDb.run(stmt, [
      row.id,
      row.name,
      row.browser_path || null,
      row.user_data_dir || '',
      row.user_agent || null,
      row.proxy_server || null,
      row.proxy_username || null,
      row.proxy_password || null,
      row.credit_remaining != null ? row.credit_remaining : 0,
      row.tags || null,
      row.cookies || null,
      row.cookie_expires || null,
      row.is_logged_in != null ? row.is_logged_in : 0,
      row.created_at || new Date().toISOString(),
      row.updated_at || new Date().toISOString(),
    ], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });

  try {
    const rows = await allRows();
    console.log(`Found ${rows.length} profiles in legacy DB`);
    let imported = 0;
    for (const row of rows) {
      const exists = await getExists(row.id);
      if (exists) {
        console.log(`Skipping existing profile ${row.id}`);
        continue;
      }
      await insertProfile(row);
      console.log(`Imported profile ${row.id}`);
      imported++;
    }
    console.log(`Imported ${imported} profiles into target DB`);
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    legacyDb.close();
    targetDb.close();
  }
}

run();
