import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

type FilePathsState = {
  // Default locations
  channelProjectsPath: string;
  singleVideoPath: string;
  tempVideoPath: string;
  
  // Naming conventions for files
  fileNaming: NamingConvention;
  
  // Naming conventions for folders
  folderNaming: FolderNamingConvention;
  
  // Actions
  setChannelProjectsPath: (path: string) => void;
  setSingleVideoPath: (path: string) => void;
  setTempVideoPath: (path: string) => void;
  setFileNamingConvention: (type: keyof NamingConvention, pattern: string) => void;
  setFolderNamingConvention: (type: keyof FolderNamingConvention, pattern: string) => void;
  resetToDefaults: () => void;
};

const defaultState = {
  channelProjectsPath: '',
  singleVideoPath: '',
  tempVideoPath: '',
  fileNaming: {
    video: '{name}_{timestamp}.mp4',
    audio: '{name}_{timestamp}.mp3',
    image: '{name}_{timestamp}.png',
    json: '{name}_{timestamp}.json',
    text: '{name}_{timestamp}.txt',
  },
  folderNaming: {
    project: '{channel_name}_{date}',
    assets: 'assets',
    output: 'output',
    temp: 'temp',
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
      
      resetToDefaults: () => {
        set(defaultState);
      },
    }),
    {
      name: 'file-paths-storage',
    }
  )
);
