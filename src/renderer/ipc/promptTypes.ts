import { hasWindow, hasInvoke, safeCall, invoke } from "./invoke";

const getAll = () => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.promptTypes &&
    typeof (window as any).electronAPI.promptTypes.getAll === "function"
  )
    return safeCall(() => (window as any).electronAPI.promptTypes.getAll());
  if (hasInvoke()) return invoke("master-prompt-types:getAll");
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getById = (id: number) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.promptTypes &&
    typeof (window as any).electronAPI.promptTypes.getById === "function"
  )
    return safeCall(() => (window as any).electronAPI.promptTypes.getById(id));
  if (hasInvoke()) return invoke("master-prompt-types:getById", { id });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const getByName = (typeName: string) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.promptTypes &&
    typeof (window as any).electronAPI.promptTypes.getByName === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.promptTypes.getByName(typeName)
    );
  if (hasInvoke()) return invoke("master-prompt-types:getByName", { typeName });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const create = (input: any) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.promptTypes &&
    typeof (window as any).electronAPI.promptTypes.create === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.promptTypes.create(input)
    );
  if (hasInvoke()) return invoke("master-prompt-types:create", input);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const update = (id: number, updates: any) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.promptTypes &&
    typeof (window as any).electronAPI.promptTypes.update === "function"
  )
    return safeCall(() =>
      (window as any).electronAPI.promptTypes.update(id, updates)
    );
  if (hasInvoke()) return invoke("master-prompt-types:update", { id, updates });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const deleteType = (id: number) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.promptTypes &&
    typeof (window as any).electronAPI.promptTypes.delete === "function"
  )
    return safeCall(() => (window as any).electronAPI.promptTypes.delete(id));
  if (hasInvoke()) return invoke("master-prompt-types:delete", { id });
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

export default { getAll, getById, getByName, create, update, deleteType };
