import { hasWindow, hasInvoke, safeCall, invoke } from "./invoke";

const getAll = () => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.masterPrompts &&
    typeof (window as any).electronAPI.masterPrompts.getAll === "function"
  )
    return safeCall(() => (window as any).electronAPI.masterPrompts.getAll());
  if (hasInvoke()) return invoke("master-prompts:getAll");
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getById = (id: number) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.masterPrompts &&
    typeof (window as any).electronAPI.masterPrompts.getById === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.masterPrompts.getById(id)
    );
  if (hasInvoke()) return invoke("master-prompts:getById", id);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getByProvider = (provider: string) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.masterPrompts &&
    typeof (window as any).electronAPI.masterPrompts.getByProvider ===
      "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.masterPrompts.getByProvider(provider)
    );
  if (hasInvoke()) return invoke("master-prompts:getByProvider", provider);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const createPrompt = (prompt: any) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.masterPrompts &&
    typeof (window as any).electronAPI.masterPrompts.create === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.masterPrompts.create(prompt)
    );
  if (hasInvoke()) return invoke("master-prompts:create", prompt);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const updatePrompt = (id: number, prompt: any) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.masterPrompts &&
    typeof (window as any).electronAPI.masterPrompts.update === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.masterPrompts.update(id, prompt)
    );
  if (hasInvoke()) return invoke("master-prompts:update", id, prompt);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const deletePrompt = (id: number) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.masterPrompts &&
    typeof (window as any).electronAPI.masterPrompts.delete === "function"
  )
    return safeCall(() => (window as any).electronAPI.masterPrompts.delete(id));
  if (hasInvoke()) return invoke("master-prompts:delete", id);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const archivePrompt = (id: number) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.masterPrompts &&
    typeof (window as any).electronAPI.masterPrompts.archive === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.masterPrompts.archive(id)
    );
  if (hasInvoke()) return invoke("master-prompts:archive", id);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

export default {
  getAll,
  getById,
  getByProvider,
  createPrompt,
  updatePrompt,
  deletePrompt,
  archivePrompt,
};
