// Thin wrapper to access master-prompts IPC reliably at runtime.
// Some build/runtime environments might not expose `electronAPI.masterPrompts` directly,
// so this helper falls back to the generic invoke API if needed.

const hasDirect = () => {
  try {
    return typeof window !== 'undefined' && !!(window as any).electronAPI && typeof (window as any).electronAPI.masterPrompts === 'object';
  } catch {
    return false;
  }
};

const hasInvoke = () => {
  try {
    return typeof window !== 'undefined' && !!(window as any).electronAPI && typeof (window as any).electronAPI.invoke === 'function';
  } catch {
    return false;
  }
};

async function safeCall(fn: () => Promise<any>) {
  try {
    const res = await fn();
    return res;
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getAll() {
  if (hasDirect()) return safeCall(() => (window as any).electronAPI.masterPrompts.getAll());
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:getAll'));
  return { success: false, error: 'ipc-not-available' };
}

export async function getById(id: number) {
  if (hasDirect() && typeof (window as any).electronAPI.masterPrompts.getById === 'function')
    return safeCall(() => (window as any).electronAPI.masterPrompts.getById(id));
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:getById', id));
  return { success: false, error: 'ipc-not-available' };
}

export async function getByProvider(provider: string) {
  if (hasDirect() && typeof (window as any).electronAPI.masterPrompts.getByProvider === 'function')
    return safeCall(() => (window as any).electronAPI.masterPrompts.getByProvider(provider));
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:getByProvider', provider));
  return { success: false, error: 'ipc-not-available' };
}

export async function getByKind(kind: string) {
  if (hasDirect() && typeof (window as any).electronAPI.masterPrompts.getByKind === 'function')
    return safeCall(() => (window as any).electronAPI.masterPrompts.getByKind(kind));
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:getByKind', kind));
  return { success: false, error: 'ipc-not-available' };
}

export async function createPrompt(prompt: any) {
  if (hasDirect() && typeof (window as any).electronAPI.masterPrompts.create === 'function')
    return safeCall(() => (window as any).electronAPI.masterPrompts.create(prompt));
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:create', prompt));
  return { success: false, error: 'ipc-not-available' };
}

export async function updatePrompt(id: number, prompt: any) {
  if (hasDirect() && typeof (window as any).electronAPI.masterPrompts.update === 'function')
    return safeCall(() => (window as any).electronAPI.masterPrompts.update(id, prompt));
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:update', id, prompt));
  return { success: false, error: 'ipc-not-available' };
}

export async function deletePrompt(id: number) {
  if (hasDirect() && typeof (window as any).electronAPI.masterPrompts.delete === 'function')
    return safeCall(() => (window as any).electronAPI.masterPrompts.delete(id));
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:delete', id));
  return { success: false, error: 'ipc-not-available' };
}

export async function archivePrompt(id: number) {
  if (hasDirect() && typeof (window as any).electronAPI.masterPrompts.archive === 'function')
    return safeCall(() => (window as any).electronAPI.masterPrompts.archive(id));
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke('master-prompts:archive', id));
  return { success: false, error: 'ipc-not-available' };
}

export default {
  getAll,
  getById,
  getByProvider,
  getByKind,
  createPrompt,
  updatePrompt,
  deletePrompt,
};
