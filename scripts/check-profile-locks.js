/**
 * Check if profile directory might be locked
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const profileDir = path.join(
  process.env.APPDATA,
  "veo3-automation",
  "profiles"
);

console.log("🔍 Checking for Profile Lock Issues");
console.log("===================================\n");

// List all profiles
if (fs.existsSync(profileDir)) {
  const profiles = fs.readdirSync(profileDir);
  console.log(`📁 Found ${profiles.length} profiles:`);
  profiles.forEach((p) => {
    const fullPath = path.join(profileDir, p);
    const stat = fs.statSync(fullPath);
    console.log(`  - ${p} (${stat.isDirectory() ? "dir" : "file"})`);
  });
} else {
  console.log("❌ Profile directory not found:", profileDir);
}

// Check for running Chrome processes
console.log("\n🔍 Running Chrome Processes:");
try {
  const output = execSync('wmic process list brief | find /I "chrome"', {
    encoding: "utf8",
  });
  if (output.trim()) {
    console.log("Active Chrome processes found:");
    console.log(output);
  } else {
    console.log("✅ No Chrome processes running");
  }
} catch (e) {
  console.log("✅ No Chrome processes running");
}

// Check for port locks
console.log("\n🔍 Checking Debug Ports (9200-9300):");
try {
  const output = execSync("netstat -ano | findstr LISTEN", {
    encoding: "utf8",
  });
  const lines = output.split("\n");
  const debugPorts = lines.filter(
    (line) =>
      line.includes(":92") ||
      line.includes(":93") ||
      line.includes(":94") ||
      line.includes(":95")
  );

  if (debugPorts.length > 0) {
    console.log("Ports in use (potential conflicts):");
    debugPorts.forEach((p) => console.log("  " + p.trim()));
  } else {
    console.log("✅ No debug ports in use");
  }
} catch (e) {
  console.log("Could not check port usage:", e.message);
}

// Check if LastLoginProfile exists (indicates Chrome is running)
console.log("\n🔍 Checking Chrome Lock Files:");
const testProfilePath = path.join(
  profileDir,
  "Test_1_profile_1759543753314_5dh46418c"
);
if (fs.existsSync(testProfilePath)) {
  try {
    const lockFile = path.join(testProfilePath, "Lock");
    if (fs.existsSync(lockFile)) {
      console.log(
        "⚠️  Lock file found (Chrome may be running with this profile):",
        lockFile
      );
    } else {
      console.log("✅ No lock file (profile not in use)");
    }

    const singletonPath = path.join(testProfilePath, "Singleton");
    if (fs.existsSync(singletonPath)) {
      console.log("⚠️  Singleton file found:", singletonPath);
    }
  } catch (e) {
    console.log("Could not check lock files:", e.message);
  }
}
