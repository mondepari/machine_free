import type { SettingsState } from './store';

export const settingsSelectors = {
  selectImageProviders: (state: SettingsState) => state.imageProviders,
  selectDefaultProvider: (state: SettingsState) => state.imageProviders.default,
  selectCustomProvider: (state: SettingsState) => state.imageProviders.custom,
  selectActiveProvider: (state: SettingsState) => {
    const { default: defaultProvider, custom } = state.imageProviders;
    return defaultProvider.enabled ? defaultProvider : custom.enabled ? custom : null;
  },
}; 