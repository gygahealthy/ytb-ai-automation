// Export all AI Prompt Config components
export {
  AIPromptConfigPage,
  default,
} from "../../../pages/admin/AIPromptConfigPage";
export { ConfigForm } from "./ConfigForm";
export { ConfigTable } from "./ConfigTable";
export { ComponentSelector } from "./ComponentSelector";

// Re-export hook from hooks folder
export { useAIPromptConfig } from "../../../hooks/useAIPromptConfig";
export type { ConfigFormState } from "../../../hooks/useAIPromptConfig";
