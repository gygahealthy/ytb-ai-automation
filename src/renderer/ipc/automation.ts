import { hasWindow, hasInvoke, safeCall, invoke } from './invoke';

const start = (taskId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.automation && typeof (window as any).electronAPI.automation.start === 'function')
    return safeCall(() => (window as any).electronAPI.automation.start(taskId));
  if (hasInvoke()) return invoke('automation:start', taskId);
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

const stop = (taskId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.automation && typeof (window as any).electronAPI.automation.stop === 'function')
    return safeCall(() => (window as any).electronAPI.automation.stop(taskId));
  if (hasInvoke()) return invoke('automation:stop', taskId);
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

export default { start, stop };
