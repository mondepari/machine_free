import { ImageProviderConfig } from '../imagine/settings';

export interface UserSettings {
  // ... existing settings ...
  imageProvider: {
    [key: string]: ImageProviderConfig;
  };
}

export interface UserStore {
  settings: UserSettings;
  updateImageProviderConfig: (provider: string, config: Partial<ImageProviderConfig>) => void;
  // ... other store methods ...
} 