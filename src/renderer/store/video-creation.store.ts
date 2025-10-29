import { create } from "zustand";
import { persist } from "zustand/middleware";
import { JsonDraft, Prompt, VideoCreationJob } from "../types/video-creation.types";

interface VideoCreationStore {
  // State
  prompts: Prompt[];
  jobs: VideoCreationJob[];
  drafts: JsonDraft[];
  history: {
    past: Prompt[][];
    future: Prompt[][];
  };
  globalPreviewMode: boolean;
  statusFilter: "all" | "idle" | "processing" | "completed" | "failed";
  sortBy: "index" | "status"; // Sort by array index or by status

  // Prompt Actions
  addPrompt: () => void;
  removePrompt: (id: string) => void;
  updatePrompt: (id: string, text: string) => void;
  togglePromptSelection: (id: string) => void;
  togglePromptPreview: (id: string) => void;
  togglePromptProfileSelect: (id: string) => void;
  updatePromptProfile: (id: string, profileId: string) => void;
  updatePromptProject: (id: string, projectId: string) => void;
  selectAllPrompts: () => void;
  clearAllSelections: () => void;
  toggleAllSelections: () => void;
  removeSelectedPrompts: () => void;
  clearAllPrompts: () => void;
  setPrompts: (prompts: Prompt[]) => void;

  // JSON Actions
  loadFromJson: (jsonString: string, mode: "replace" | "add") => boolean;

  // History Actions (Undo/Redo)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Draft Actions
  saveDraft: (name: string) => void;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => void;

  // Job Actions
  createJob: (promptId: string, promptText: string) => string;
  updateJobStatus: (jobId: string, status: VideoCreationJob["status"], data?: Partial<VideoCreationJob>) => void;
  updateJobProgress: (jobId: string, progress: number) => void;
  removeJob: (jobId: string) => void;

  // UI Actions
  toggleGlobalPreview: () => void;
  setStatusFilter: (filter: "all" | "idle" | "processing" | "completed" | "failed") => void;
  setSortBy: (sortBy: "index" | "status") => void;

  // DB Sync Actions
  loadJobsFromDB: (generations: any[]) => void;
  syncJobFromDB: (generation: any) => void;
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

const saveToHistory = (
  currentPrompts: Prompt[],
  history: { past: Prompt[][]; future: Prompt[][] }
): { past: Prompt[][]; future: Prompt[][] } => {
  return {
    past: [...history.past, currentPrompts],
    future: [],
  };
};

export const useVideoCreationStore = create<VideoCreationStore>()(
  persist(
    (set, get) => ({
      // Initial State
      prompts: [{ id: generateId(), text: "", order: 0, selected: false, showPreview: false }],
      jobs: [],
      drafts: [],
      history: {
        past: [],
        future: [],
      },
      globalPreviewMode: false,
      statusFilter: "all",
      sortBy: "index",

      // Prompt Actions
      addPrompt: () => {
        const { prompts, history } = get();
        const newPrompt: Prompt = {
          id: generateId(),
          text: "",
          order: 0,
          selected: false,
        };
        // Add to top and reorder
        const reorderedPrompts = [newPrompt, ...prompts.map((p) => ({ ...p, order: p.order + 1 }))];
        set({
          prompts: reorderedPrompts,
          history: saveToHistory(prompts, history),
        });
      },

      removePrompt: (id: string) => {
        const { prompts, history } = get();
        if (prompts.length > 1) {
          set({
            prompts: prompts.filter((p) => p.id !== id),
            history: saveToHistory(prompts, history),
          });
        }
      },

      updatePrompt: (id: string, text: string) => {
        const { prompts, history } = get();
        const oldPrompts = [...prompts];
        const newPrompts = prompts.map((p) => (p.id === id ? { ...p, text } : p));

        set({
          prompts: newPrompts,
          history: saveToHistory(oldPrompts, history),
        });
      },

      togglePromptSelection: (id: string) => {
        set({
          prompts: get().prompts.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)),
        });
      },

      togglePromptPreview: (id: string) => {
        set({
          prompts: get().prompts.map((p) => (p.id === id ? { ...p, showPreview: !p.showPreview } : p)),
        });
      },

      togglePromptProfileSelect: (id: string) => {
        set({
          prompts: get().prompts.map((p) => (p.id === id ? { ...p, showProfileSelect: !p.showProfileSelect } : p)),
        });
      },

      updatePromptProfile: (id: string, profileId: string) => {
        set({
          prompts: get().prompts.map((p) => (p.id === id ? { ...p, profileId: profileId || undefined } : p)),
        });
      },
      updatePromptProject: (id: string, projectId: string) => {
        set({
          prompts: get().prompts.map((p) => (p.id === id ? { ...p, projectId: projectId || undefined } : p)),
        });
      },

      selectAllPrompts: () => {
        set({
          prompts: get().prompts.map((p) => ({ ...p, selected: true })),
        });
      },

      clearAllSelections: () => {
        set({
          prompts: get().prompts.map((p) => ({ ...p, selected: false })),
        });
      },

      toggleAllSelections: () => {
        const { prompts } = get();
        const allSelected = prompts.every((p) => p.selected);
        set({
          prompts: prompts.map((p) => ({ ...p, selected: !allSelected })),
        });
      },

      removeSelectedPrompts: () => {
        const { prompts, history } = get();
        const newPrompts = prompts.filter((p) => !p.selected);
        if (newPrompts.length === 0) {
          // Keep at least one prompt
          set({
            prompts: [{ id: generateId(), text: "", order: 0, selected: false, showPreview: false }],
            history: saveToHistory(prompts, history),
          });
        } else {
          set({
            prompts: newPrompts,
            history: saveToHistory(prompts, history),
          });
        }
      },

      clearAllPrompts: () => {
        const { prompts, history } = get();
        set({
          prompts: [{ id: generateId(), text: "", order: 0, selected: false, showPreview: false }],
          history: saveToHistory(prompts, history),
        });
      },

      setPrompts: (prompts: Prompt[]) => {
        const { history } = get();
        set({
          prompts,
          history: saveToHistory(get().prompts, history),
        });
      },

      // JSON Actions
      loadFromJson: (jsonString: string, mode: "replace" | "add") => {
        try {
          const parsed = JSON.parse(jsonString);
          if (!Array.isArray(parsed)) {
            return false;
          }

          const { prompts, history } = get();
          const newPrompts: Prompt[] = parsed.map((item, idx) => ({
            id: generateId(),
            text: typeof item === "string" ? item : item.text || "",
            order: idx,
            selected: false,
          }));

          if (mode === "add") {
            // Check if we only have one empty prompt (initial state)
            const hasOnlyEmptyPrompt = prompts.length === 1 && prompts[0].text.trim() === "";

            if (hasOnlyEmptyPrompt) {
              // Replace the empty prompt instead of adding to it
              set({
                prompts: newPrompts,
                history: saveToHistory(prompts, history),
              });
            } else {
              // Add to top and reorder existing prompts
              const reorderedExisting = prompts.map((p) => ({ ...p, order: p.order + newPrompts.length }));
              set({
                prompts: [...newPrompts, ...reorderedExisting],
                history: saveToHistory(prompts, history),
              });
            }
          } else {
            set({
              prompts: newPrompts,
              history: saveToHistory(prompts, history),
            });
          }
          return true;
        } catch (error) {
          return false;
        }
      },

      // History Actions
      undo: () => {
        const { history, prompts } = get();
        if (history.past.length === 0) return;

        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);

        set({
          prompts: previous,
          history: {
            past: newPast,
            future: [prompts, ...history.future],
          },
        });
      },

      redo: () => {
        const { history, prompts } = get();
        if (history.future.length === 0) return;

        const next = history.future[0];
        const newFuture = history.future.slice(1);

        set({
          prompts: next,
          history: {
            past: [...history.past, prompts],
            future: newFuture,
          },
        });
      },

      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,

      // Draft Actions
      saveDraft: (name: string) => {
        const { prompts, drafts } = get();
        const existingDraft = drafts.find((d) => d.name === name);

        if (existingDraft) {
          // Update existing draft
          set({
            drafts: drafts.map((d) =>
              d.name === name ? { ...d, prompts: [...prompts], updatedAt: new Date().toISOString() } : d
            ),
          });
        } else {
          // Create new draft
          const newDraft: JsonDraft = {
            id: generateId(),
            name,
            prompts: [...prompts],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set({ drafts: [...drafts, newDraft] });
        }
      },

      loadDraft: (id: string) => {
        const { drafts, prompts, history } = get();
        const draft = drafts.find((d) => d.id === id);
        if (draft) {
          set({
            prompts: draft.prompts.map((p) => ({ ...p, selected: false })),
            history: saveToHistory(prompts, history),
          });
        }
      },

      deleteDraft: (id: string) => {
        set({ drafts: get().drafts.filter((d) => d.id !== id) });
      },

      // Job Actions
      createJob: (promptId: string, promptText: string) => {
        const jobId = generateId();
        const newJob: VideoCreationJob = {
          id: jobId,
          promptId,
          promptText,
          status: "processing",
          progress: 0,
          createdAt: new Date().toISOString(),
        };
        set({ jobs: [newJob, ...get().jobs] });
        return jobId;
      },

      updateJobStatus: (jobId: string, status: VideoCreationJob["status"], data?: Partial<VideoCreationJob>) => {
        set({
          jobs: get().jobs.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status,
                  ...data,
                  ...(status === "completed" || status === "failed" ? { completedAt: new Date().toISOString() } : {}),
                }
              : job
          ),
        });
      },

      updateJobProgress: (jobId: string, progress: number) => {
        set({
          jobs: get().jobs.map((job) => (job.id === jobId ? { ...job, progress: Math.min(progress, 99) } : job)),
        });
      },

      removeJob: (jobId: string) => {
        set({ jobs: get().jobs.filter((job) => job.id !== jobId) });
      },

      // UI Actions
      toggleGlobalPreview: () => {
        set({ globalPreviewMode: !get().globalPreviewMode });
      },

      setStatusFilter: (filter: "all" | "idle" | "processing" | "completed" | "failed") => {
        set({ statusFilter: filter });
      },

      setSortBy: (sortBy: "index" | "status") => {
        set({ sortBy });
      },

      // DB Sync Actions
      loadJobsFromDB: (generations: any[]) => {
        // Convert DB generations to jobs and match them with prompts
        const jobs: VideoCreationJob[] = generations.map((gen) => ({
          id: gen.id,
          promptId: gen.id, // Use generation.id as promptId for now
          promptText: gen.prompt || "",
          generationId: gen.id,
          status: gen.status === "pending" ? "processing" : gen.status,
          progress: gen.status === "completed" ? 100 : gen.status === "processing" ? 50 : 0,
          createdAt: gen.createdAt || new Date().toISOString(),
          completedAt: gen.completedAt,
          videoUrl: gen.videoUrl,
          error: gen.errorMessage,
        }));

        console.log(`[VideoCreationStore] Loaded ${jobs.length} jobs from DB`);
        set({ jobs });
      },

      syncJobFromDB: (generation: any) => {
        const { jobs } = get();

        // Find existing job by generationId
        const existingJobIndex = jobs.findIndex((j) => j.generationId === generation.id);

        if (existingJobIndex >= 0) {
          // Update existing job
          const updatedJobs = [...jobs];
          updatedJobs[existingJobIndex] = {
            ...updatedJobs[existingJobIndex],
            status: generation.status === "pending" ? "processing" : generation.status,
            progress: generation.status === "completed" ? 100 : generation.status === "processing" ? 50 : 0,
            videoUrl: generation.videoUrl,
            error: generation.errorMessage,
            completedAt: generation.completedAt,
          };
          set({ jobs: updatedJobs });
        } else {
          // Create new job from generation
          const newJob: VideoCreationJob = {
            id: generation.id,
            promptId: generation.id,
            promptText: generation.prompt || "",
            generationId: generation.id,
            status: generation.status === "pending" ? "processing" : generation.status,
            progress: generation.status === "completed" ? 100 : generation.status === "processing" ? 50 : 0,
            createdAt: generation.createdAt || new Date().toISOString(),
            completedAt: generation.completedAt,
            videoUrl: generation.videoUrl,
            error: generation.errorMessage,
          };
          set({ jobs: [newJob, ...jobs] });
        }
      },
    }),
    {
      name: "veo3-video-creation-store",
      version: 3, // Increment version to enable job persistence
      // Persist jobs to maintain video generation state across app reloads
      // The polling context will refresh stale data automatically
      partialize: (state) => ({
        prompts: state.prompts,
        jobs: state.jobs, // NOW ENABLED - persist jobs for video generation continuity
        drafts: state.drafts,
        globalPreviewMode: state.globalPreviewMode,
        statusFilter: state.statusFilter,
        sortBy: state.sortBy,
      }),
    }
  )
);
