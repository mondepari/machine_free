import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ImageProviderConfigKey, ImageProviderModelListKey } from '@/app/[variants]/(main)/settings/imagine/const';
import { ProviderItem } from '@/app/[variants]/(main)/settings/imagine/type';
import { LocalDB } from '@/database/core';
import { ImageProviderType } from '@/types/settings';

export interface ImageProviderStore {
  enabledModels: Record<string, string[]>;
  providerConfigs: Record<string, ProviderItem>;
  setEnabledModels: (providerId: string, models: string[]) => void;
  setProviderConfig: (providerId: string, config: ProviderItem) => void;
}

export const useImageProviderStore = create<ImageProviderStore>()(
  persist(
    (set) => ({
      enabledModels: {},
      providerConfigs: {},
      setEnabledModels: (providerId, models) =>
        set((state) => ({
          enabledModels: {
            ...state.enabledModels,
            [providerId]: models,
          },
        })),
      setProviderConfig: (providerId, config) =>
        set((state) => ({
          providerConfigs: {
            ...state.providerConfigs,
            [providerId]: config,
          },
        })),
    }),
    {
      name: LocalDB.ImageProvider,
      partialize: (state) => ({
        enabledModels: state.enabledModels,
        providerConfigs: state.providerConfigs,
      }),
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
); 