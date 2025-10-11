import create from "zustand";
import veo3IPC from "../ipc/veo3";

interface VEO3Store {
  // projectsByProfile stores array of projects keyed by profileId
  projectsByProfile: Record<string, any[]>;
  setProjectsForProfile: (profileId: string, projects: any[]) => void;
  getProjectsForProfile: (profileId: string) => any[] | undefined;
  fetchProjectsForProfile: (profileId: string) => Promise<any[] | null>;
}

export const useVeo3Store = create<VEO3Store>((set, get) => ({
  projectsByProfile: {},
  setProjectsForProfile: (profileId: string, projects: any[]) =>
    set((s) => ({ projectsByProfile: { ...s.projectsByProfile, [profileId]: projects } })),
  getProjectsForProfile: (profileId: string) => {
    return get().projectsByProfile[profileId];
  },
  fetchProjectsForProfile: async (profileId: string) => {
    // If cached, return cached
    const cached = get().projectsByProfile[profileId];
    if (cached && cached.length > 0) return cached;

    try {
      const res = await veo3IPC.fetchProjectsFromAPI(profileId);
      if (res && res.success) {
        // res.data may be an array or an object containing projects
        let projects: any[] = [];
        if (Array.isArray(res.data)) projects = res.data;
        else if (res.data && Array.isArray(res.data.projects)) projects = res.data.projects;
        else if (res.data && Array.isArray(res.data.result?.projects)) projects = res.data.result.projects;
        else if (res.data && Array.isArray(res.data.result)) projects = res.data.result;

        // store even if empty array to avoid re-fetching
        get().setProjectsForProfile(profileId, projects);
        return projects;
      }
      return null;
    } catch (err) {
      console.error("veo3.store: failed to fetch projects", err);
      return null;
    }
  },
}));

export default useVeo3Store;
