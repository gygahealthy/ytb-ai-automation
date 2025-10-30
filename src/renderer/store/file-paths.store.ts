import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NamingConvention = {
  video: string;
  audio: string;
  image: string;
  json: string;
  text: string;
};

export type FolderNamingConvention = {
  project: string;
  assets: string;
  output: string;
  temp: string;
};

export type FilePathsOptions = {
  autoCreateDateFolder: boolean;
  autoIndexFilename: boolean;
  addEpochTimeToFilename: boolean;
};

type FilePathsState = {
  // Default locations
  channelProjectsPath: string;
  singleVideoPath: string;
  tempVideoPath: string;
  veo3ImagesPath: string; // VEO3 image gallery storage path

  // Naming conventions for files
  fileNaming: NamingConvention;

  // Naming conventions for folders
  folderNaming: FolderNamingConvention;

  // File paths options
  options: FilePathsOptions;

  // Actions
  setChannelProjectsPath: (path: string) => void;
  setSingleVideoPath: (path: string) => void;
  setTempVideoPath: (path: string) => void;
  setVeo3ImagesPath: (path: string) => void;
  setFileNamingConvention: (type: keyof NamingConvention, pattern: string) => void;
  setFolderNamingConvention: (type: keyof FolderNamingConvention, pattern: string) => void;
  setFilePathsOption: (key: keyof FilePathsOptions, value: boolean) => void;
  resetToDefaults: () => void;
};

const defaultState = {
  channelProjectsPath: "",
  singleVideoPath: "",
  tempVideoPath: "",
  veo3ImagesPath: "",
  fileNaming: {
    video: "{name}_{timestamp}.mp4",
    audio: "{name}_{timestamp}.mp3",
    image: "{name}_{timestamp}.png",
    json: "{name}_{timestamp}.json",
    text: "{name}_{timestamp}.txt",
  },
  folderNaming: {
    project: "{channel_name}_{date}",
    assets: "assets",
    output: "output",
    temp: "temp",
  },
  options: {
    autoCreateDateFolder: false,
    autoIndexFilename: false,
    addEpochTimeToFilename: false,
  },
};

export const useFilePathsStore = create<FilePathsState>()(
  persist(
    (set) => ({
      ...defaultState,

      setChannelProjectsPath: (path) => {
        set({ channelProjectsPath: path });
      },

      setSingleVideoPath: (path) => {
        set({ singleVideoPath: path });
      },

      setTempVideoPath: (path) => {
        set({ tempVideoPath: path });
      },

      setVeo3ImagesPath: (path) => {
        set({ veo3ImagesPath: path });
      },

      setFileNamingConvention: (type, pattern) => {
        set((state) => ({
          fileNaming: {
            ...state.fileNaming,
            [type]: pattern,
          },
        }));
      },

      setFolderNamingConvention: (type, pattern) => {
        set((state) => ({
          folderNaming: {
            ...state.folderNaming,
            [type]: pattern,
          },
        }));
      },

      setFilePathsOption: (key, value) => {
        set((state) => ({
          options: {
            ...state.options,
            [key]: value,
          },
        }));
      },

      resetToDefaults: () => {
        set(defaultState);
      },
    }),
    {
      name: "file-paths-storage",
    }
  )
);
