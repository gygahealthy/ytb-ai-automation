// Lightweight helpers for invoking electron API safely from renderer
export const hasWindow = () => {
  try {
    return typeof window !== 'undefined' && !!(window as any).electronAPI;
  } catch {
    return false;
  }
};

export const hasInvoke = () => {
  try {
    return hasWindow() && typeof (window as any).electronAPI.invoke === 'function';
  } catch {
    return false;
  }
};

export async function safeCall(fn: () => Promise<any>) {
  try {
    const res = await fn();
    return res;
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function invoke(channel: string, ...args: any[]) {
  if (!hasWindow()) return { success: false, error: 'ipc-not-available' };
  if (hasInvoke()) return safeCall(() => (window as any).electronAPI.invoke(channel, ...args));
  if (typeof (window as any).electronAPI.invoke === 'function') return safeCall(() => (window as any).electronAPI.invoke(channel, ...args));
  return { success: false, error: 'ipc-not-available' };
}
