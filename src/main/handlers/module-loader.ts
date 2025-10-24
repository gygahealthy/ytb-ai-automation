import * as fs from "fs";
import * as path from "path";

/**
 * Recursively find all module directories in a given folder
 * A module is identified by having manifest.json, handlers/, or index.js
 */
function findModulesInFolder(folderPath: string): string[] {
  const modules: string[] = [];
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(folderPath, entry.name);

      // Check if this is a module by looking for manifest.json, handlers/, or index.js
      const manifestPath = path.join(fullPath, "manifest.json");
      const handlersPath = path.join(fullPath, "handlers");
      const indexPath = path.join(fullPath, "index.js");

      const isModule = fs.existsSync(manifestPath) || fs.existsSync(handlersPath) || fs.existsSync(indexPath);

      // If this directory is a module, add it
      if (isModule) {
        modules.push(fullPath);
      }
    }
  } catch (e) {
    // silently ignore read errors
  }
  return modules;
}

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

  // Collect all modules to process in order
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(modulesDir, { withFileTypes: true });
  } catch (e) {
    console.warn("Module loader: failed to read modules directory", e);
    return allRegistrations;
  }

  // First, collect top-level modules (direct children with manifest.json OR handlers/index.js)
  const allModulePaths: string[] = [];

  for (const d of entries) {
    if (!d.isDirectory()) continue;
    const modulePath = path.join(modulesDir, d.name);

    // Check if this is a module by looking for manifest.json, handlers/, or index.js
    const manifestPath = path.join(modulePath, "manifest.json");
    const handlersPath = path.join(modulePath, "handlers");
    const indexPath = path.join(modulePath, "index.js");

    const isModule = fs.existsSync(manifestPath) || fs.existsSync(handlersPath) || fs.existsSync(indexPath);

    // Top-level: check if this directory itself is a module
    if (isModule) {
      allModulePaths.push(modulePath);
    } else {
      // For folders without module indicators (like 'common'), recursively find modules inside
      const nestedModules = findModulesInFolder(modulePath);
      allModulePaths.push(...nestedModules);
    }
  }

  // Now process all collected module paths in order
  for (const modulePath of allModulePaths) {
    const manifestPath = path.join(modulePath, "manifest.json");
    const moduleName = path.relative(modulesDir, modulePath).replace(/\\/g, "/");
    let hasManifest = false;
    if (fs.existsSync(manifestPath)) {
      hasManifest = true;
      // read manifest to optionally allow disabling modules via manifest
      try {
        const manifestRaw = fs.readFileSync(manifestPath, "utf8");
        const manifest = JSON.parse(manifestRaw);
        if (manifest && manifest.disabled) {
          console.log(`Module loader: skipping disabled module ${moduleName}`);
          continue;
        }
      } catch (err) {
        console.warn(`Module loader: failed to parse manifest for ${moduleName}`, err);
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
        // Otherwise inspect named exports for ALL arrays of registrations
        const allRegistrations: any[] = [];
        for (const val of Object.values(exported)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0].channel === "string") {
            allRegistrations.push(...val);
          }
        }
        // Return combined array or null if no registrations found
        return allRegistrations.length > 0 ? allRegistrations : null;
      } catch (e) {
        return null;
      }
      return null;
    };

    // Candidate paths (prefer compiled dist when available)
    const candidates = [] as string[];
    const cwd = process.cwd();
    const srcPrefix = path.join(cwd, "src");

    // Determine which candidate to try based on modulePath location
    if (modulePath.startsWith(srcPrefix)) {
      // If modulePath is in src, prefer the compiled dist version
      const compiledPath = modulePath.replace(srcPrefix, path.join(cwd, "dist"));
      candidates.push(path.join(compiledPath, "handlers", "registrations"));
      // Fall back to src if dist doesn't exist
      candidates.push(path.join(modulePath, "handlers", "registrations"));
    } else {
      // If modulePath is already in dist, only try that
      candidates.push(path.join(modulePath, "handlers", "registrations"));
    }

    for (const cand of candidates) {
      const regs = tryRequire(cand);
      if (regs && regs.length > 0) {
        allRegistrations.push(...regs);
        console.log(`Module loader: loaded registrations for ${moduleName} from ${path.relative(process.cwd(), cand)}`);
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
          console.log(`Module loader: loaded module ${moduleName} via registerModule${hasManifest ? "" : " (no manifest)"}'`);
        } else {
          console.log(`Module loader: module ${moduleName} did not export registerModule${hasManifest ? "" : " (no manifest)"}'`);
        }
      } catch (err) {
        if (!hasManifest) {
          console.warn(`Module loader: failed to load module ${moduleName} (no manifest). Trying next.`, err);
        } else {
          console.warn(`Module loader: failed to load module ${moduleName}`, err);
        }
      }
    }
  }

  // dialog handlers are now a first-class module under main/modules/dialog

  return allRegistrations;
}
