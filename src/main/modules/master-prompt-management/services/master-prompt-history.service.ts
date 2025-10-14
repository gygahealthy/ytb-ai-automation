import { ApiResponse } from "../../../../shared/types";
import {
  promptHistoryRepository,
  CreatePromptHistoryInput,
} from "../repository/master-prompt-history.repository";

const repository = promptHistoryRepository;

class PromptHistoryService {
  async getByPromptId(req: any): Promise<ApiResponse<any[]>> {
    try {
      const promptId = req?.promptId ?? req;
      const limit = req?.limit ?? 50;
      const data = await repository.getByPromptId(
        Number(promptId),
        Number(limit)
      );
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

  async create(req: any): Promise<ApiResponse<any>> {
    try {
      const input: CreatePromptHistoryInput = req?.input ?? req;
      const data = await repository.create(input);
      return { success: true, data };
    } catch (err: any) {
      if (
        String(err) === "Error: duplicate" ||
        (err && err.message === "duplicate")
      ) {
        return { success: false, error: "duplicate" };
      }
      return { success: false, error: String(err) };
    }
  }

  async delete(req: any): Promise<ApiResponse<boolean>> {
    try {
      const id = req?.id ?? req;
      const ok = await repository.delete(Number(id));
      return { success: ok, data: ok };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async deleteByPromptId(req: any): Promise<ApiResponse<boolean>> {
    try {
      const promptId = req?.promptId ?? req;
      const ok = await repository.deleteByPromptId(Number(promptId));
      return { success: ok, data: ok };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }
}

export const promptHistoryService = new PromptHistoryService();
