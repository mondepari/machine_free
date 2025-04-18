// src/types/user/settings.ts
import { ImageProviderConfig } from '../imagine/settings';
import { UserModelProviderConfig } from './settings/modelProvider'; // Assuming location
import { UserKeyVaults } from './settings/keyVaults'; // Assuming location
// ... other necessary imports

export interface UserSettings {
  // ... existing settings ...

  languageModel?: UserModelProviderConfig; // Add this line
  keyVaults?: UserKeyVaults; // Add this line

  imageProvider?: { // Ensure this property exists if needed
    [key: string]: ImageProviderConfig;
  };

  // ... any other properties ...
}

// ... rest of the file (UserStore interface etc.)