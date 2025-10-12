import * as fs from "fs";
import * as path from "path";

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
  let modulesDir = path.resolve(__dirname, "../modules");
  if (!fs.existsSync(modulesDir)) {
    const srcFallback = path.resolve(process.cwd(), "src", "main", "modules");
    if (fs.existsSync(srcFallback)) {
      modulesDir = srcFallback;
    }
  }

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  } catch (e) {
    console.warn("Module loader: failed to read modules directory", e);
    return allRegistrations;
  }

  for (const d of entries) {
    if (!d.isDirectory()) continue;
    const modulePath = path.join(modulesDir, d.name);
    const manifestPath = path.join(modulePath, "manifest.json");
    let hasManifest = false;
    if (fs.existsSync(manifestPath)) {
      hasManifest = true;
      // read manifest to optionally allow disabling modules via manifest
      try {
        const manifestRaw = fs.readFileSync(manifestPath, "utf8");
        const manifest = JSON.parse(manifestRaw);
        if (manifest && manifest.disabled) {
          console.log(`Module loader: skipping disabled module ${d.name}`);
          continue;
        }
      } catch (err) {
        console.warn(`Module loader: failed to parse manifest for ${d.name}`, err);
        // continue loading — non-fatal
      }
    }

    // First try: load a handlers/registrations file from the module which should
    // export the IpcRegistration[] without initializing heavy services.
    let loadedRegistrations: any[] | null = null;
    const tryRequire = (p: string) => {
      try {
        if (!fs.existsSync(p) && !fs.existsSync(p + ".js") && !fs.existsSync(p + ".ts")) return null;
        const exported = require(p);
        // If the module directly exports an array (default export), return it
        if (Array.isArray(exported)) return exported;
        // Otherwise inspect named exports for an array of registrations
        for (const val of Object.values(exported)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0].channel === "string") {
            return val as any[];
          }
        }
      } catch (e) {
        return null;
      }
      return null;
    };

    // Candidate paths (prefer compiled dist when available)
    const candidates = [] as string[];
    // handlers/registrations under modulePath
    candidates.push(path.join(modulePath, "handlers", "registrations"));
    // compiled dist equivalent
    const cwd = process.cwd();
    const srcPrefix = path.join(cwd, "src");
    if (modulePath.startsWith(srcPrefix)) {
      const compiledPath = modulePath.replace(srcPrefix, path.join(cwd, "dist"));
      candidates.push(path.join(compiledPath, "handlers", "registrations"));
    }

    for (const cand of candidates) {
      const regs = tryRequire(cand);
      if (regs && regs.length > 0) {
        allRegistrations.push(...regs);
        console.log(`Module loader: loaded registrations for ${d.name} from ${path.relative(process.cwd(), cand)}`);
        loadedRegistrations = regs;
        break;
      }
    }

    // CRITICAL: only try registerModule if we did NOT load registrations from handlers/registrations
    // to avoid double-registration of the same channels
    if (!loadedRegistrations) {
      // Fallback: require module index and call registerModule if it exists. This is
      // less safe because requiring the module may execute top-level code.
      try {
        let mod: any;
        try {
          mod = require(modulePath);
        } catch (innerErr) {
          if (modulePath.startsWith(srcPrefix)) {
            const compiledPath = modulePath.replace(srcPrefix, path.join(cwd, "dist"));
            const compiledIndex = path.join(compiledPath, "index.js");
            if (fs.existsSync(compiledIndex)) {
              mod = require(compiledPath);
            } else {
              throw innerErr;
            }
          } else {
            throw innerErr;
          }
        }

        if (mod && typeof mod.registerModule === "function") {
          mod.registerModule((regs: any[]) => allRegistrations.push(...regs));
          console.log(`Module loader: loaded module ${d.name} via registerModule${hasManifest ? "" : " (no manifest)"}'`);
        } else {
          console.log(`Module loader: module ${d.name} did not export registerModule${hasManifest ? "" : " (no manifest)"}'`);
        }
      } catch (err) {
        if (!hasManifest) {
          console.warn(`Module loader: failed to load module ${d.name} (no manifest). Trying next.`, err);
        } else {
          console.warn(`Module loader: failed to load module ${d.name}`, err);
        }
      }
    }
  }

  // dialog handlers are now a first-class module under main/modules/dialog

  return allRegistrations;
}
