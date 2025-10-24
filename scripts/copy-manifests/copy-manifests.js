#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const cwd = process.cwd();
const src = path.join(cwd, "src", "main", "modules");
const dst = path.join(cwd, "dist", "main", "modules");

if (!fs.existsSync(src)) {
  console.log("copy-manifests: source modules folder not found, nothing to copy.");
  process.exit(0);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name === "manifest.json") {
      const rel = path.relative(src, full);
      const target = path.join(dst, rel);
      const tdir = path.dirname(target);
      if (!fs.existsSync(tdir)) fs.mkdirSync(tdir, { recursive: true });
      fs.copyFileSync(full, target);
      console.log(`copy-manifests: copied ${rel}`);
    }
  }
}

try {
  walk(src);
  console.log("copy-manifests: completed");
} catch (err) {
  console.error("copy-manifests: error while copying manifests", err);
  process.exit(2);
}
