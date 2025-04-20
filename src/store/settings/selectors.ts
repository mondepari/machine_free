import type { SettingsState } from './store';

export const settingsSelectors = {
  selectActiveProvider: (state: SettingsState) => {
    const { default: defaultProvider, custom } = state.imageProviders;
    return defaultProvider.enabled ? defaultProvider : custom.enabled ? custom : null;
  },
  selectCustomProvider: (state: SettingsState) => state.imageProviders.custom,
  selectDefaultProvider: (state: SettingsState) => state.imageProviders.default,
  selectImageProviders: (state: SettingsState) => state.imageProviders,
}; 