import { StateCreator } from 'zustand';
import { ImageProviderConfig } from '@/types/imagine/settings';
import { UserStore } from '../../store';

export interface ImageProviderAction {
  settings: {
    imageProvider: {
      [key: string]: ImageProviderConfig;
    };
  };
  updateImageProviderConfig: (provider: string, config: Partial<ImageProviderConfig>) => void;
}

export const createImageProviderSlice: StateCreator<
  UserStore,
  [['zustand/devtools', never]],
  [],
  ImageProviderAction
> = (set) => ({
  settings: {
    imageProvider: {},
  },
  updateImageProviderConfig: (provider, config) =>
    set((state) => ({
      settings: {
        ...state.settings,
        imageProvider: {
          ...state.settings.imageProvider,
          [provider]: {
            ...state.settings.imageProvider[provider],
            ...config,
          },
        },
      },
    })),
}); 