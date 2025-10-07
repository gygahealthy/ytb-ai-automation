import fs from 'fs';
import path from 'path';

/**
 * Dynamically discover modules from the `main/modules` directory by reading
 * each module's `manifest.json`. If a module exports `registerModule`, the
 * function is called with a registrar callback to collect its IPC registrations.
 */
export function collectModuleRegistrations(): any[] {
  const allRegistrations: any[] = [];
  // Prefer compiled runtime modules folder (e.g. dist/main/modules). When
  // running from source (dev mode) the compiled folder may not exist, so
  // fall back to the repository's source modules directory.
  let modulesDir = path.resolve(__dirname, '../modules');
  if (!fs.existsSync(modulesDir)) {
    const srcFallback = path.resolve(process.cwd(), 'src', 'main', 'modules');
    if (fs.existsSync(srcFallback)) {
      modulesDir = srcFallback;
    }
  }

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  } catch (e) {
    console.warn('Module loader: failed to read modules directory', e);
    return allRegistrations;
  }

  for (const d of entries) {
    if (!d.isDirectory()) continue;
    const modulePath = path.join(modulesDir, d.name);
    const manifestPath = path.join(modulePath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      // skip folders without manifest
      continue;
    }

    // read manifest to optionally allow disabling modules via manifest
    try {
      const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestRaw);
      if (manifest && manifest.disabled) {
        console.log(`Module loader: skipping disabled module ${d.name}`);
        continue;
      }
    } catch (err) {
      console.warn(`Module loader: failed to parse manifest for ${d.name}`, err);
      // continue - non-fatal
    }

    try {
      // require the module's index (node resolution will pick index.js / index.ts compiled output)
      const mod = require(modulePath);
      if (mod && typeof mod.registerModule === 'function') {
        mod.registerModule((regs: any[]) => allRegistrations.push(...regs));
      }
    } catch (err) {
      console.warn(`Module loader: failed to load module ${d.name}`, err);
    }
  }

  // dialog handlers are now a first-class module under main/modules/dialog

  return allRegistrations;
}
