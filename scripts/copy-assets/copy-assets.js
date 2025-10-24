#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const cwd = process.cwd();
const src = path.join(cwd, "src", "renderer", "assets");
const dst = path.join(cwd, "dist", "renderer", "assets");

if (!fs.existsSync(src)) {
  console.log("copy-assets: source assets folder not found, nothing to copy.");
  process.exit(0);
}

try {
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  // Copy files from src to dst (shallow copy, mirroring previous behavior)
  const files = fs.readdirSync(src, { withFileTypes: true });
  for (const f of files) {
    if (f.isFile()) {
      const from = path.join(src, f.name);
      const to = path.join(dst, f.name);
      fs.copyFileSync(from, to);
      console.log(`copy-assets: copied ${f.name}`);
    }
  }
  console.log("copy-assets: completed");
} catch (err) {
  console.error("copy-assets: error while copying assets", err);
  process.exit(2);
}
