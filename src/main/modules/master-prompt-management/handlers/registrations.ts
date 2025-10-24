import { IpcRegistration } from "../../../../core/ipc/types";
import { promptService } from "../services/master-prompt.service";
import { promptHistoryService } from "../services/master-prompt-history.service";
import { promptTypesService } from "../services/master-prompt-types.service";
import { aiPromptService } from "../services/ai-prompt-cfg.service";
import { aiChatService } from "../services/ai-prompt-chat.service";
import { ComponentDiscoveryHandlers } from "../ipc-handlers/component-discovery.handler";

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
    description: "Get master prompts by type (script, topic, video_prompt, audio_prompt)",
    handler: async (req: any) => await promptService.getByType(req as any),
  },
  {
    channel: "master-prompts:getByChannel",
    description: "Get master prompts for a specific channel, optionally filtered by type",
    handler: async (req: any) => await promptService.getByChannel(req as any),
  },
  {
    channel: "master-prompts:getGlobalPrompts",
    description: "Get global prompts (not associated with any channel)",
    handler: async (req: any) => await promptService.getGlobalPrompts(req as any),
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
    handler: async (req: any) => await promptService.extractVariables(req as any),
  },
  {
    channel: "master-prompts:populateTemplate",
    description: "Populate template with variables",
    handler: async (req: any) => await promptService.populateTemplate(req as any),
  },
  // Prompt history handlers
  {
    channel: "prompt-history:getByPromptId",
    description: "Get prompt history by prompt ID",
    handler: async (req: any) => await promptHistoryService.getByPromptId(req as any),
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
    handler: async (req: any) => await promptHistoryService.deleteByPromptId(req as any),
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
    handler: async (req: any) => await promptTypesService.getTypeByName(req?.typeName),
  },
  {
    channel: "master-prompt-types:create",
    description: "Create new prompt type",
    handler: async (req: any) => await promptTypesService.createType(req as any),
  },
  {
    channel: "master-prompt-types:update",
    description: "Update prompt type",
    handler: async (req: any) => await promptTypesService.updateType(req?.id, req?.updates),
  },
  {
    channel: "master-prompt-types:delete",
    description: "Delete prompt type",
    handler: async (req: any) => await promptTypesService.deleteType(req?.id),
  },
  // AI Prompt Config handlers
  {
    channel: "aiPromptConf:getConfig",
    description: "Get AI prompt configuration for a component",
    handler: async (req: any) => await aiPromptService.getConfigForComponent(req as string),
  },
  {
    channel: "aiPromptConf:getAllConfigs",
    description: "Get all AI prompt configurations",
    handler: async () => await aiPromptService.getAllConfigs(),
  },
  {
    channel: "aiPromptConf:saveConfig",
    description: "Save or update AI prompt configuration",
    handler: async (req: any) => await aiPromptService.saveConfig(req as any),
  },
  {
    channel: "aiPromptConf:deleteConfig",
    description: "Delete AI prompt configuration",
    handler: async (req: any) => await aiPromptService.deleteConfig(req as string),
  },
  {
    channel: "aiPromptChat:callAI",
    description: "Call AI with configured prompt for a component",
    handler: async (req: any) =>
      await aiChatService.callAIWithPrompt(req as any, (componentName: string) =>
        aiPromptService.getConfigForComponent(componentName)
      ),
  },
  // Component Discovery handlers
  {
    channel: "componentDiscovery:getAllComponents",
    description: "Get all discovered components from the project",
    handler: async () => ComponentDiscoveryHandlers.getAllComponents(),
  },
  {
    channel: "componentDiscovery:getComponentHierarchy",
    description: "Get component hierarchy tree structure",
    handler: async () => ComponentDiscoveryHandlers.getComponentHierarchy(),
  },
  {
    channel: "componentDiscovery:getComponentsByCategory",
    description: "Get components filtered by category",
    handler: async (req: any) => ComponentDiscoveryHandlers.getComponentsByCategory(req as string),
  },
  {
    channel: "componentDiscovery:searchComponents",
    description: "Search components by query string",
    handler: async (req: any) => ComponentDiscoveryHandlers.searchComponents(req as string),
  },
  {
    channel: "componentDiscovery:getComponentTreeForUI",
    description: "Get component tree formatted for UI rendering",
    handler: async () => ComponentDiscoveryHandlers.getComponentTreeForUI(),
  },
];
