import { Page } from "puppeteer";
import { AutomationAction } from "../../../types";

/**
 * Execute basic browser actions
 */
export class BasicActions {
  /**
   * Click on an element
   */
  async click(page: Page, action: AutomationAction): Promise<void> {
    const timeout = action.timeout || 5000;
    if (action.selector) {
      await page.waitForSelector(action.selector, { timeout });
      await page.click(action.selector);
    }
  }

  /**
   * Type text into an element
   */
  async type(page: Page, action: AutomationAction): Promise<void> {
    const timeout = action.timeout || 5000;
    if (action.selector && action.value) {
      await page.waitForSelector(action.selector, { timeout });
      await page.type(action.selector, action.value);
    }
  }

  /**
   * Wait for a specified time
   */
  async wait(page: Page, action: AutomationAction): Promise<void> {
    const timeout = action.timeout || 5000;
    await page.waitForTimeout(timeout);
  }

  /**
   * Navigate to a URL
   */
  async navigate(page: Page, action: AutomationAction): Promise<void> {
    const timeout = action.timeout || 30000;
    if (action.value) {
      await page.goto(action.value, { waitUntil: "networkidle2", timeout });
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(page: Page, action: AutomationAction): Promise<void> {
    await page.screenshot({
      path: action.value || `screenshot_${Date.now()}.png`,
    });
  }

  /**
   * Scroll the page
   */
  async scroll(page: Page, _action: AutomationAction): Promise<void> {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
  }
}

