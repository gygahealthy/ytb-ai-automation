#!/usr/bin/env node
/**
 * Headless Cookie Worker Script
 * Runs in a separate process to extract cookies using Puppeteer
 * Outputs result as JSON to stdout
 *
 * Usage: node headless-cookie-worker.js '{"userDataDir":"...", "targetUrl":"...", "timeoutMs":60000}'
 */

const puppeteer = require("puppeteer");

async function main() {
  try {
    // Parse arguments
    const argsJson = process.argv[2];
    if (!argsJson) {
      throw new Error("Missing arguments JSON");
    }

    const { userDataDir, targetUrl, timeoutMs } = JSON.parse(argsJson);

    if (!userDataDir) {
      throw new Error("Missing userDataDir");
    }

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
    });

    try {
      const pages = await browser.pages();
      const page = pages.length > 0 ? pages[0] : await browser.newPage();

      // Set timeout
      page.setDefaultTimeout(timeoutMs || 60000);
      page.setDefaultNavigationTimeout(timeoutMs || 60000);

      // Navigate to target URL
      await page.goto(targetUrl || "https://gemini.google.com", {
        waitUntil: "networkidle2",
        timeout: timeoutMs || 60000,
      });

      // Wait a bit for cookies to be set
      await page.waitForTimeout(2000);

      // Extract ALL cookies
      const cookies = await page.cookies();

      // Convert to cookie collection format
      const cookieCollection = {};
      for (const cookie of cookies) {
        cookieCollection[cookie.name] = cookie.value;
      }

      // Close browser
      await browser.close();

      // Output result as JSON
      const result = {
        success: true,
        cookies: cookieCollection,
      };

      console.log(JSON.stringify(result));
      process.exit(0);
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    // Output error as JSON
    const result = {
      success: false,
      error: error.message || String(error),
    };

    console.log(JSON.stringify(result));
    process.exit(1);
  }
}

main();
