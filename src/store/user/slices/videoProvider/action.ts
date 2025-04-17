import { StateCreator } from 'zustand';

import type { UserStore } from '../../store';
import type { VideoProviderSettings } from './initialState';

export interface VideoProviderAction {
  updateVideoProviderConfig: (config: Partial<VideoProviderSettings>) => void;
}

export const createVideoProviderSlice: StateCreator<
  UserStore,
  [],
  [],
  VideoProviderAction
> = (set) => ({
  updateVideoProviderConfig: (config) => {
    console.log('[Action updateVideoProviderConfig] Received config:', config);
    set(
      (state) => {
        console.log('[Action updateVideoProviderConfig] Current state before update:', state.settings?.videoProvider);
        const currentSettings = state.settings || {};
        const currentVideoProvider = currentSettings.videoProvider || {};

        const newState = {
          settings: {
            ...currentSettings,
            videoProvider: {
              ...currentVideoProvider,
              ...config,
            },
          },
        };
        console.log('[Action updateVideoProviderConfig] New state being set:', newState.settings?.videoProvider);
        return newState;
      }
    );
    console.log('[Action updateVideoProviderConfig] Update finished.');
  },
}); 