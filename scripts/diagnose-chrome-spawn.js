/**
 * Diagnose Chrome spawning issues on Windows
 * Tests the spawn + connect pattern
 */

const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DEBUG_PORT = 9999;
const TEST_PROFILE_DIR = path.join(
  process.env.APPDATA,
  "veo3-automation",
  "test-spawn-debug"
);

console.log("🔍 Chrome Spawn Diagnostics");
console.log("================================");
console.log(`Chrome executable: ${CHROME_PATH}`);
console.log(`Exists: ${fs.existsSync(CHROME_PATH)}`);
console.log(`Debug port: ${DEBUG_PORT}`);
console.log(`Profile dir: ${TEST_PROFILE_DIR}`);

// Ensure test profile dir exists and is clean
if (fs.existsSync(TEST_PROFILE_DIR)) {
  console.log("🗑️  Cleaning old profile directory...");
  fs.rmSync(TEST_PROFILE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_PROFILE_DIR, { recursive: true });

const chromeArgs = [
  `--remote-debugging-port=${DEBUG_PORT}`,
  "--remote-debugging-address=127.0.0.1",
  `--user-data-dir=${TEST_PROFILE_DIR}`,
  "--start-maximized",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-popup-blocking",
  "--disable-sync",
];

console.log("\n📋 Chrome Arguments:");
chromeArgs.forEach((arg, i) => console.log(`  ${i + 1}. ${arg}`));

async function testSpawn() {
  return new Promise((resolve) => {
    console.log("\n🚀 Spawning Chrome process...");

    // Test 1: With stdio: "ignore"
    console.log("\n--- Test 1: stdio='ignore' (current implementation) ---");
    const process1 = spawn(CHROME_PATH, chromeArgs, {
      detached: true,
      stdio: "ignore",
    });

    process1.unref();

    let portResponding = false;

    // Wait a bit and check if port responds
    setTimeout(async () => {
      console.log("⏳ Waiting 3 seconds for Chrome to start...");

      for (let i = 0; i < 6; i++) {
        try {
          const response = await checkPort();
          if (response) {
            portResponding = true;
            console.log(`✅ Port ${DEBUG_PORT} is responding!`);
            break;
          }
        } catch (err) {
          console.log(
            `❌ Attempt ${i + 1}: Port not responding - ${err.message}`
          );
        }
        if (i < 5) await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!portResponding) {
        console.log(
          "\n⚠️  Issue found: Chrome process started but debugging port not responding"
        );
        console.log("Possible causes:");
        console.log(
          "  1. Profile directory is locked by another Chrome instance"
        );
        console.log("  2. Chrome crashed during initialization");
        console.log("  3. Firewall blocking localhost connections");
        console.log("  4. Port already in use by another process");

        // Check if port is in use
        checkPortInUse();
      }

      // Kill any lingering Chrome processes
      console.log("\n🧹 Cleaning up test processes...");
      require("child_process").execSync(
        "taskkill /F /IM chrome.exe /T 2>nul || exit 0"
      );

      resolve(!portResponding);
    }, 500);
  });
}

function checkPort() {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: "127.0.0.1",
        port: DEBUG_PORT,
        path: "/json/version",
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on("error", () => {
      reject(new Error("Connection refused"));
    });

    req.setTimeout(1000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

function checkPortInUse() {
  try {
    const cmd = `netstat -ano | findstr :${DEBUG_PORT}`;
    const output = require("child_process")
      .execSync(cmd, { encoding: "utf8" })
      .trim();
    if (output) {
      console.log(`\n⚠️  Port ${DEBUG_PORT} is in use:`);
      console.log(output);
    }
  } catch (e) {
    console.log(`ℹ️  Port ${DEBUG_PORT} is free`);
  }
}

testSpawn().then((hasProblem) => {
  console.log("\n" + "=".repeat(50));
  if (hasProblem) {
    console.log("⚠️  DIAGNOSIS: Chrome spawn issue detected");
    console.log("\nRecommended fixes:");
    console.log("1. Kill all Chrome instances: taskkill /F /IM chrome.exe");
    console.log("2. Check if profile dir is locked");
    console.log("3. Try with stdio: 'pipe' to capture errors");
  } else {
    console.log("✅ Chrome spawn working correctly");
  }
  process.exit(hasProblem ? 1 : 0);
});
