import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { StateCreator } from 'zustand/vanilla';

import { createDevtools } from '../middleware/createDevtools';

interface ImageProviderSettings {
  apiKey?: string;
  enabled: boolean;
  proxyUrl?: {
    desc?: string;
    placeholder: string;
    title?: string;
  };
}

interface ImageProviders {
  custom: ImageProviderSettings;
  default: ImageProviderSettings;
}

export interface SettingsState {
  imageProviders: ImageProviders;
}

export interface SettingsActions {
  updateImageProvider: (
    id: keyof ImageProviders,
    settings: Partial<ImageProviderSettings>,
  ) => void;
}

const initialState: SettingsState = {
  imageProviders: {
    custom: {
      apiKey: '',
      enabled: false,
      proxyUrl: {
        desc: '',
        placeholder: 'https://api.custom.com/v1',
        title: '',
      },
    },
    default: {
      apiKey: '',
      enabled: false,
      proxyUrl: {
        desc: '',
        placeholder: 'https://api.example.com/v1',
        title: '',
      },
    },
  },
};

export type SettingsStore = SettingsState & SettingsActions;

const createSettingsSlice: StateCreator<
  SettingsStore,
  [['zustand/devtools', never]]
> = (set) => ({
  ...initialState,
  updateImageProvider: (id, settings) =>
    set(
      (state) => {
        // Если включаем провайдер
        if (settings.enabled) {
          const otherId = id === 'default' ? 'custom' : 'default';
          // Обновляем обоих провайдеров одновременно
          return {
            imageProviders: {
              ...state.imageProviders,
              [id]: {
                ...state.imageProviders[id],
                ...settings,
                enabled: true,
              },
              [otherId]: {
                ...state.imageProviders[otherId],
                enabled: false, // Выключаем другого провайдера
              },
            },
          };
        }
        
        // Если просто обновляем настройки без включения
        return {
          imageProviders: {
            ...state.imageProviders,
            [id]: {
              ...state.imageProviders[id],
              ...settings,
            },
          },
        };
      },
      false,
      'updateImageProvider',
    ),
});

const devtools = createDevtools('settings');

export const useSettingStore = createWithEqualityFn<SettingsStore>()(
  subscribeWithSelector(devtools(createSettingsSlice)),
  shallow,
); 