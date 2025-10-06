import * as fs from "fs/promises";
import * as path from "path";
import { Page, Protocol } from "puppeteer";
import { Logger } from "../../../../../utils/logger.util";
import { AutomationAction } from "../../auto.types";

const logger = new Logger("CookieActions");

/**
 * Execute cookie actions (import/export)
 */
export class CookieActions {
  /**
   * Import or export cookies
   */
  async cookie(page: Page, action: AutomationAction): Promise<void> {
    const cookieAction = action.cookieAction;

    if (!cookieAction) {
      throw new Error("Cookie action type (import/export) is required");
    }

    if (cookieAction === "import") {
      await this.importCookies(page, action);
    } else if (cookieAction === "export") {
      await this.exportCookies(page, action);
    }
  }

  /**
   * Import cookies from file or data
   */
  private async importCookies(page: Page, action: AutomationAction): Promise<void> {
    let cookies: Protocol.Network.CookieParam[] = [];

    // Import from file if path is provided
    if (action.cookiePath) {
      const filePath = path.resolve(action.cookiePath);
      logger.info(`Importing cookies from ${filePath}`);

      const fileContent = await fs.readFile(filePath, "utf-8");
      const parsedCookies = JSON.parse(fileContent);
      cookies = parsedCookies;
    }
    // Import from cookieData if provided
    else if (action.cookieData) {
      logger.info("Importing cookies from action data");
      cookies = action.cookieData.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || "/",
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
      }));
    } else {
      throw new Error("Either cookiePath or cookieData must be provided for cookie import");
    }

    // Set cookies in the page
    await page.setCookie(...cookies);
    logger.info(`Imported ${cookies.length} cookies`);
  }

  /**
   * Export cookies to file
   */
  private async exportCookies(page: Page, action: AutomationAction): Promise<void> {
    const cookies = await page.cookies();
    logger.info(`Exporting ${cookies.length} cookies`);

    if (!action.cookiePath) {
      throw new Error("cookiePath is required for cookie export");
    }

    const filePath = path.resolve(action.cookiePath);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write cookies to file
    await fs.writeFile(filePath, JSON.stringify(cookies, null, 2), "utf-8");
    logger.info(`Cookies exported to ${filePath}`);
  }
}
