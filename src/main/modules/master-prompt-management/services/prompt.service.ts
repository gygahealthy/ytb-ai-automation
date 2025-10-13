import { ApiResponse } from '../../../../shared/types';
import { promptRepository } from '../repository/prompt.repository';

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
      if (!data) return { success: false, error: 'Not found' };
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

  async getByKind(req: any): Promise<ApiResponse<any[]>> {
    try {
      const kind = req?.promptKind ?? req;
      const data = await repository.getByKind(String(kind));
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }

  async getByProviderAndKind(req: any): Promise<ApiResponse<any>> {
    try {
      const provider = req?.provider ?? (Array.isArray(req) ? req[0] : undefined);
      const kind = req?.promptKind ?? (Array.isArray(req) ? req[1] : undefined);
      const data = await repository.getByProviderAndKind(String(provider), String(kind));
      if (!data) return { success: false, error: 'Not found' };
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
      try { console.log('[prompt.service] update called with req:', JSON.stringify(req)); } catch (e) { console.log('[prompt.service] update called (non-serializable req)'); }
      const id = req?.id ?? (Array.isArray(req) ? req[0] : undefined);
      const updates = req?.updates ?? (Array.isArray(req) ? req[1] : undefined) ?? req;
      const data = await repository.update(Number(id), updates);
      if (!data) return { success: false, error: 'Not found' };
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
      const template = req?.template ?? (Array.isArray(req) ? req[0] : '');
      const variables = req?.variables ?? (Array.isArray(req) ? req[1] : {});
      const res = repository.populateTemplate(String(template), variables || {});
      return { success: true, data: res };
    } catch (err: any) {
      return { success: false, error: String(err) };
    }
  }
}

export const promptService = new PromptService();
