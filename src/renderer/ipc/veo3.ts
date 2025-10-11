import { hasWindow, hasInvoke, safeCall, invoke } from './invoke';

const fetchProjectsFromAPI = (profileId: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.fetchProjectsFromAPI === 'function')
    return safeCall(() => (window as any).electronAPI.veo3.fetchProjectsFromAPI(profileId));
  if (hasInvoke()) return invoke('veo3:fetchProjectsFromAPI', { profileId });
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

const createProjectViaAPI = (profileId: string, projectTitle: string) => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.createProjectViaAPI === 'function')
    return safeCall(() => (window as any).electronAPI.veo3.createProjectViaAPI(profileId, projectTitle));
  if (hasInvoke()) return invoke('veo3:createProjectViaAPI', { profileId, projectTitle });
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

const getAll = () => {
  if (!hasWindow()) return Promise.resolve({ success: false, error: 'ipc-not-available' });
  if ((window as any).electronAPI.veo3 && typeof (window as any).electronAPI.veo3.getAll === 'function')
    return safeCall(() => (window as any).electronAPI.veo3.getAll());
  if (hasInvoke()) return invoke('veo3:getAll');
  return Promise.resolve({ success: false, error: 'ipc-not-available' });
};

export default {
  fetchProjectsFromAPI,
  createProjectViaAPI,
  getAll,
};

