#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function main() {
  try {
    const repoRoot = path.resolve(__dirname, "..", "..");
    const src = path.join(repoRoot, "src", "main", "storage", "schema.sql");
    const dest = path.join(repoRoot, "dist", "main", "storage", "schema.sql");

    if (!fs.existsSync(src)) {
      console.error(`Source file not found: ${src}`);
      process.exitCode = 2;
      return;
    }

    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} -> ${dest}`);
    process.exitCode = 0;
  } catch (err) {
    console.error("Failed to copy schema.sql:", err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}
