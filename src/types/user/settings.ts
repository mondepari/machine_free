// src/types/user/settings.ts
import { ImageProviderConfig } from '../imagine/settings';
import { UserModelProviderConfig } from './settings/modelProvider';
import { UserKeyVaults } from './settings/keyVaults';
import { UserGeneralConfig } from './settings/general';
import { UserSystemAgentConfig } from './settings/systemAgent';
import { UserSyncSettings } from './settings/sync';
// ... other necessary imports

export * from './settings/general';
export * from './settings/keyVaults';
export * from './settings/modelProvider';
export * from './settings/sync';
export * from './settings/systemAgent';
// Re-export other necessary types as needed

export interface UserSettings {
  general?: UserGeneralConfig;
  imageProvider?: {
    [key: string]: ImageProviderConfig;
  };
  keyVaults?: UserKeyVaults;
  languageModel?: UserModelProviderConfig;
  sync?: UserSyncSettings;
  systemAgent?: UserSystemAgentConfig;

  // ... any other properties ...
}

// ... rest of the file (UserStore interface etc.)