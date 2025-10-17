import { ApiResponse } from "../../../../shared/types";
import {
  promptRepository,
  PromptType,
} from "../repository/master-prompt.repository";

const repository = promptRepository;

class PromptService {
  async getAll(): Promise<ApiResponse<any[]>> {
    try {
      const data = await repository.getAll();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async getById(req: any): Promise<ApiResponse<any>> {
    try {
      const id = req?.id ?? req;
      const data = await repository.getById(Number(id));
      if (!data) return { success: false, error: "Not found" };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async getByProvider(req: any): Promise<ApiResponse<any[]>> {
    try {
      const provider = req?.provider ?? req;
      const data = await repository.getByProvider(String(provider));
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  /**
   * Get prompts by type (script, topic, video_prompt, audio_prompt)
   */
  async getByType(req: any): Promise<ApiResponse<any[]>> {
    try {
      const promptType = req?.promptType ?? req;
      if (!promptType) {
        return { success: false, error: "promptType is required" };
      }
      const data = await repository.getByType(String(promptType) as PromptType);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  /**
   * Get prompts for a specific channel, optionally filtered by type
   */
  async getByChannel(req: any): Promise<ApiResponse<any[]>> {
    try {
      const channelId =
        req?.channelId ?? (Array.isArray(req) ? req[0] : undefined);
      const promptType =
        req?.promptType ?? (Array.isArray(req) ? req[1] : undefined);

      if (!channelId) {
        return { success: false, error: "channelId is required" };
      }

      const data = await repository.getByChannel(
        String(channelId),
        promptType ? (String(promptType) as PromptType) : undefined
      );
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  /**
   * Get global prompts (not associated with any channel)
   */
  async getGlobalPrompts(req: any): Promise<ApiResponse<any[]>> {
    try {
      const promptType = req?.promptType ?? req;
      const data = await repository.getGlobalPrompts(
        promptType ? (String(promptType) as PromptType) : undefined
      );
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async create(req: any): Promise<ApiResponse<any>> {
    try {
      const input = req?.input ?? req;
      const data = await repository.create(input);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async update(req: any): Promise<ApiResponse<any>> {
    try {
      // Debug: log incoming request payload for update calls
      try {
        console.log(
          "[prompt.service] update called with req:",
          JSON.stringify(req)
        );
      } catch (e) {
        console.log("[prompt.service] update called (non-serializable req)");
      }
      const id = req?.id ?? (Array.isArray(req) ? req[0] : undefined);
      const updates =
        req?.updates ?? (Array.isArray(req) ? req[1] : undefined) ?? req;
      const data = await repository.update(Number(id), updates);
      if (!data) return { success: false, error: "Not found" };
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async deletePrompt(req: any): Promise<ApiResponse<boolean>> {
    try {
      const id = req?.id ?? req;
      const ok = await repository.delete(Number(id));
      return { success: ok, data: ok };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async archive(req: any): Promise<ApiResponse<boolean>> {
    try {
      const id = req?.id ?? (Array.isArray(req) ? req[0] : req);
      const ok = await repository.archive(Number(id));
      return { success: ok, data: ok };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async extractVariables(req: any): Promise<ApiResponse<string[]>> {
    try {
      const template = req?.template ?? req;
      const vars = repository.extractVariables(String(template));
      return { success: true, data: vars };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async populateTemplate(req: any): Promise<ApiResponse<string>> {
    try {
      const template = req?.template ?? (Array.isArray(req) ? req[0] : "");
      const variables = req?.variables ?? (Array.isArray(req) ? req[1] : {});
      const res = repository.populateTemplate(
        String(template),
        variables || {}
      );
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }
}

export const promptService = new PromptService();
