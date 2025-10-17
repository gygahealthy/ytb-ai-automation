import { IpcRegistration } from "../../../../core/ipc/types";
import { promptService } from "../services/master-prompt.service";
import { promptHistoryService } from "../services/master-prompt-history.service";
import { promptTypesService } from "../services/master-prompt-types.service";

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
    channel: "master-prompts:getByType",
    description:
      "Get master prompts by type (script, topic, video_prompt, audio_prompt)",
    handler: async (req: any) => await promptService.getByType(req as any),
  },
  {
    channel: "master-prompts:getByChannel",
    description:
      "Get master prompts for a specific channel, optionally filtered by type",
    handler: async (req: any) => await promptService.getByChannel(req as any),
  },
  {
    channel: "master-prompts:getGlobalPrompts",
    description: "Get global prompts (not associated with any channel)",
    handler: async (req: any) =>
      await promptService.getGlobalPrompts(req as any),
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
  // Master Prompt Types handlers
  {
    channel: "master-prompt-types:getAll",
    description: "Get all prompt types",
    handler: async () => await promptTypesService.getAllTypes(),
  },
  {
    channel: "master-prompt-types:getById",
    description: "Get prompt type by ID",
    handler: async (req: any) => await promptTypesService.getTypeById(req?.id),
  },
  {
    channel: "master-prompt-types:getByName",
    description: "Get prompt type by name",
    handler: async (req: any) =>
      await promptTypesService.getTypeByName(req?.typeName),
  },
  {
    channel: "master-prompt-types:create",
    description: "Create new prompt type",
    handler: async (req: any) =>
      await promptTypesService.createType(req as any),
  },
  {
    channel: "master-prompt-types:update",
    description: "Update prompt type",
    handler: async (req: any) =>
      await promptTypesService.updateType(req?.id, req?.updates),
  },
  {
    channel: "master-prompt-types:delete",
    description: "Delete prompt type",
    handler: async (req: any) => await promptTypesService.deleteType(req?.id),
  },
];
