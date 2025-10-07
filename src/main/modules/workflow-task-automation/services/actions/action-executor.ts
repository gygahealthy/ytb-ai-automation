import { Page } from "puppeteer";
import { Logger } from "../../../../../shared/utils/logger";
import { BasicActions } from "./basic.actions";
import { CookieActions } from "./cookie.actions";
import { HttpActions } from "./http.actions";
import { AutomationAction } from "../../auto.types";

const logger = new Logger("ActionExecutor");

/**
 * Main executor that coordinates all action handlers
 */
export class ActionExecutor {
  private basicActions: BasicActions;
  private httpActions: HttpActions;
  private cookieActions: CookieActions;

  constructor() {
    this.basicActions = new BasicActions();
    this.httpActions = new HttpActions();
    this.cookieActions = new CookieActions();
  }

  /**
   * Execute a single automation action
   */
  async execute(page: Page, action: AutomationAction): Promise<void> {
    logger.info(`Executing action: ${action.type}`);

    switch (action.type) {
      // Basic actions
      case "click":
        await this.basicActions.click(page, action);
        break;

      case "type":
        await this.basicActions.type(page, action);
        break;

      case "wait":
        await this.basicActions.wait(page, action);
        break;

      case "navigate":
        await this.basicActions.navigate(page, action);
        break;

      case "screenshot":
        await this.basicActions.screenshot(page, action);
        break;

      case "scroll":
        await this.basicActions.scroll(page, action);
        break;

      // HTTP actions
      case "http-request":
        await this.httpActions.httpRequest(page, action);
        break;

      // Cookie actions
      case "cookie":
        await this.cookieActions.cookie(page, action);
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    logger.info(`Action ${action.type} completed`);
  }
}
