import { hasWindow, hasInvoke, safeCall, invoke } from "./invoke";

const getAll = () => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.profile &&
    typeof (window as any).electronAPI.profile.getAll === "function"
  )
    return safeCall(() => (window as any).electronAPI.profile.getAll());
  if (hasInvoke()) return invoke("profile:getAll");
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const create = (data: any) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.profile &&
    typeof (window as any).electronAPI.profile.create === "function"
  )
    return safeCall(() => (window as any).electronAPI.profile.create(data));
  if (hasInvoke()) return invoke("profile:create", data);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const update = (id: string, data: any) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.profile &&
    typeof (window as any).electronAPI.profile.update === "function"
  )
    return safeCall(() => (window as any).electronAPI.profile.update(id, data));
  if (hasInvoke()) return invoke("profile:update", id, data);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

const del = (id: string) => {
  if (!hasWindow())
    return Promise.resolve({ success: false, error: "ipc-not-available" });
  if (
    (window as any).electronAPI.profile &&
    typeof (window as any).electronAPI.profile.delete === "function"
  )
    return safeCall(() => (window as any).electronAPI.profile.delete(id));
  if (hasInvoke()) return invoke("profile:delete", id);
  return Promise.resolve({ success: false, error: "ipc-not-available" });
};

export default { getAll, create, update, delete: del };
