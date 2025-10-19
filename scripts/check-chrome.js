/**
 * Diagnostic script to find Chrome/Chromium on Windows
 * Run with: node scripts/check-chrome.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("=== Chrome/Chromium Detection Tool ===\n");

// Check environment variable
const envPath = process.env.CHROME_EXECUTABLE_PATH;
console.log("1. Environment Variable:");
console.log(`   CHROME_EXECUTABLE_PATH: ${envPath || "NOT SET"}\n`);

// Check standard locations
const possiblePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Chromium\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

console.log("2. Checking Standard Locations:");
let found = false;
for (const chromePath of possiblePaths) {
  const exists = fs.existsSync(chromePath);
  console.log(`   ${chromePath}`);
  console.log(`   → ${exists ? "✓ FOUND" : "✗ NOT FOUND"}`);
  if (exists) found = true;
}

console.log("\n3. Checking Registry (Windows):");
try {
  const result = execSync(
    'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths" /s 2>nul | findstr /i chrome',
    { encoding: "utf8" }
  );
  console.log("   Found in registry:");
  console.log(result);
} catch (e) {
  console.log("   No Chrome entries found in registry");
}

console.log("\n4. Checking Puppeteer Bundled Browser:");
try {
  const puppeteerPath = path.join(
    __dirname,
    "../node_modules/puppeteer/.local-chromium"
  );
  const exists = fs.existsSync(puppeteerPath);
  console.log(
    `   Puppeteer .local-chromium: ${
      exists ? "✓ EXISTS" : "✗ NOT FOUND (will be downloaded on first use)"
    }`
  );
} catch (e) {
  console.log("   Error checking puppeteer path");
}

console.log("\n5. Node & npm Versions:");
console.log(`   Node: ${process.version}`);
try {
  const npmVersion = execSync("npm --version", { encoding: "utf8" }).trim();
  console.log(`   npm: ${npmVersion}`);
} catch (e) {
  console.log("   npm version: unknown");
}

console.log("\n=== RECOMMENDATION ===");
if (!found) {
  console.log(
    "Chrome not found on system. Please install one of the following:"
  );
  console.log("1. Google Chrome - https://www.google.com/chrome/");
  console.log("2. Microsoft Edge - https://www.microsoft.com/edge/download");
  console.log("3. Chromium - https://chromium.woolyss.com/");
  console.log(
    "\nOr set the CHROME_EXECUTABLE_PATH environment variable to point to your Chrome installation."
  );
} else {
  console.log("✓ Chrome found! The browser launcher should work.");
}

console.log("\n=== DEBUGGING STEPS ===");
console.log("If problems persist:");
console.log("1. Verify Chrome can be launched manually from command line");
console.log("2. Check that user profile directory has proper permissions");
console.log("3. Run: $env:CHROME_EXECUTABLE_PATH='C:\\Path\\To\\chrome.exe'");
console.log("4. Check Event Viewer for any Chrome launch errors");
