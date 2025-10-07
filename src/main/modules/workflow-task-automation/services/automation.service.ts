import puppeteer, { Browser, Page } from "puppeteer";
import { automationRepository } from "../../../storage/database";
import { AutomationTask, CreateAutomationTaskInput } from "../auto.types";
import { Logger } from "../../../../shared/utils/logger";
import { StringUtil } from "../../../../shared/utils/string";
import { ActionExecutor } from "./actions/action-executor";
import { profileService } from "../../profile-management/services/profile.service";
import { ApiResponse } from "../../../../shared/types";

const logger = new Logger("AutomationService");

export class AutomationService {
  private activeBrowsers: Map<string, Browser> = new Map();
  private actionExecutor: ActionExecutor;

  constructor() {
    this.actionExecutor = new ActionExecutor();
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<ApiResponse<AutomationTask[]>> {
    try {
      const tasks = await automationRepository.findAll();
      return { success: true, data: tasks };
    } catch (error) {
      logger.error("Failed to get tasks", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<ApiResponse<AutomationTask>> {
    try {
      const task = await automationRepository.findById(id);
      if (!task) {
        return { success: false, error: "Task not found" };
      }
      return { success: true, data: task };
    } catch (error) {
      logger.error("Failed to get task", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create new automation task
   */
  async createTask(input: CreateAutomationTaskInput): Promise<ApiResponse<AutomationTask>> {
    try {
      const task: AutomationTask = {
        id: StringUtil.generateId("task"),
        profileId: input.profileId,
        name: input.name,
        targetUrl: input.targetUrl,
        actions: input.actions,
        status: "pending",
        logs: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await automationRepository.insert(task);
      logger.info(`Task created: ${task.id}`);

      return { success: true, data: task };
    } catch (error) {
      logger.error("Failed to create task", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Start automation task
   */
  async startTask(id: string): Promise<ApiResponse<AutomationTask>> {
    try {
      const task = await automationRepository.findById(id);
      if (!task) {
        return { success: false, error: "Task not found" };
      }

      if (task.status === "running") {
        return { success: false, error: "Task is already running" };
      }

      // Update task status
      await automationRepository.update(id, {
        status: "running",
        startedAt: new Date(),
        updatedAt: new Date(),
        logs: [...task.logs, `[${new Date().toISOString()}] Task started`],
      });

      // Run automation in background
      this.runAutomation(id).catch((error) => {
        logger.error(`Automation failed for task ${id}`, error);
      });

      const updatedTask = await automationRepository.findById(id);
      return { success: true, data: updatedTask! };
    } catch (error) {
      logger.error("Failed to start task", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Stop automation task
   */
  async stopTask(id: string): Promise<ApiResponse<AutomationTask>> {
    try {
      const browser = this.activeBrowsers.get(id);
      if (browser) {
        await browser.close();
        this.activeBrowsers.delete(id);
      }

      const task = await automationRepository.findById(id);
      if (task) {
        await automationRepository.update(id, {
          status: "stopped",
          completedAt: new Date(),
          updatedAt: new Date(),
          logs: [...task.logs, `[${new Date().toISOString()}] Task stopped by user`],
        });
      }

      const updatedTask = await automationRepository.findById(id);
      return { success: true, data: updatedTask! };
    } catch (error) {
      logger.error("Failed to stop task", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Run automation workflow
   */
  private async runAutomation(taskId: string): Promise<void> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      const task = await automationRepository.findById(taskId);
      if (!task) return;

      // Get profile
      const profileResponse = await profileService.getProfileById(task.profileId);
      if (!profileResponse.success || !profileResponse.data) {
        throw new Error("Profile not found");
      }

      const profile = profileResponse.data;

      // Launch browser
      browser = await puppeteer.launch({
        headless: false,
        userDataDir: profile.userDataDir,
        executablePath: profile.browserPath,
      });

      this.activeBrowsers.set(taskId, browser);

      page = await browser.newPage();
      await this.addLog(taskId, "Browser launched");

      // Navigate to target URL
      await page.goto(task.targetUrl, { waitUntil: "networkidle2" });
      await this.addLog(taskId, `Navigated to ${task.targetUrl}`);

      // Execute actions using the ActionExecutor
      for (let i = 0; i < task.actions.length; i++) {
        const action = task.actions[i];
        await this.actionExecutor.execute(page, action);
        await this.addLog(taskId, `Executed action ${i + 1}/${task.actions.length}: ${action.type}`);
      }

      // Task completed
      await automationRepository.update(taskId, {
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      await this.addLog(taskId, "Task completed successfully");
    } catch (error) {
      logger.error(`Automation error for task ${taskId}`, error);

      await automationRepository.update(taskId, {
        status: "failed",
        completedAt: new Date(),
        error: String(error),
        updatedAt: new Date(),
      });

      await this.addLog(taskId, `Task failed: ${error}`);
    } finally {
      if (browser) {
        await browser.close();
        this.activeBrowsers.delete(taskId);
      }
    }
  }

  /**
   * Add log to task
   */
  private async addLog(taskId: string, message: string): Promise<void> {
    await automationRepository.addLog(taskId, `[${new Date().toISOString()}] ${message}`);
  }
}

export const automationService = new AutomationService();
