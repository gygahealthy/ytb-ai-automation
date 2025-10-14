import { IpcRegistration } from "../../../../core/ipc/types";
import { promptService } from "../services/master-prompt.service";
import { promptHistoryService } from "../services/master-prompt-history.service";

export const promptRegistrations: IpcRegistration[] = [
  {
    channel: "master-prompts:getAll",
    description: "Get all master prompts",
    handler: async () => await promptService.getAll(),
  },
  {
    channel: "master-prompts:getById",
    description: "Get master prompt by id",
    handler: async (req: any) => await promptService.getById(req as any),
  },
  {
    channel: "master-prompts:getByProvider",
    description: "Get master prompts by provider",
    handler: async (req: any) => await promptService.getByProvider(req as any),
  },
  {
    channel: "master-prompts:getByKind",
    description: "Get master prompts by kind",
    handler: async (req: any) => await promptService.getByKind(req as any),
  },
  {
    channel: "master-prompts:getByProviderAndKind",
    description: "Get master prompt by provider and kind",
    handler: async (req: any) =>
      await promptService.getByProviderAndKind(req as any),
  },
  {
    channel: "master-prompts:create",
    description: "Create master prompt",
    handler: async (req: any) => await promptService.create(req as any),
  },
  {
    channel: "master-prompts:update",
    description: "Update master prompt",
    handler: async (req: any) => await promptService.update(req as any),
  },
  {
    channel: "master-prompts:archive",
    description: "Archive master prompt",
    handler: async (req: any) => await promptService.archive(req as any),
  },
  {
    channel: "master-prompts:delete",
    description: "Delete master prompt",
    handler: async (req: any) => await promptService.deletePrompt(req as any),
  },
  {
    channel: "master-prompts:extractVariables",
    description: "Extract variables from template",
    handler: async (req: any) =>
      await promptService.extractVariables(req as any),
  },
  {
    channel: "master-prompts:populateTemplate",
    description: "Populate template with variables",
    handler: async (req: any) =>
      await promptService.populateTemplate(req as any),
  },
  // Prompt history handlers
  {
    channel: "prompt-history:getByPromptId",
    description: "Get prompt history by prompt ID",
    handler: async (req: any) =>
      await promptHistoryService.getByPromptId(req as any),
  },
  {
    channel: "prompt-history:getById",
    description: "Get prompt history entry by ID",
    handler: async (req: any) => await promptHistoryService.getById(req as any),
  },
  {
    channel: "prompt-history:create",
    description: "Create prompt history entry",
    handler: async (req: any) => await promptHistoryService.create(req as any),
  },
  {
    channel: "prompt-history:delete",
    description: "Delete prompt history entry",
    handler: async (req: any) => await promptHistoryService.delete(req as any),
  },
  {
    channel: "prompt-history:deleteByPromptId",
    description: "Delete all prompt history for a prompt",
    handler: async (req: any) =>
      await promptHistoryService.deleteByPromptId(req as any),
  },
];
