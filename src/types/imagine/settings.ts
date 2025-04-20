
export type GlobalImageProviderKey = string;

export interface ImageProviderConfig {
  apiKey?: string;
  enabled: boolean;
  enabledModels: string[];
  fetchOnClient?: boolean;
  proxyUrl?: string;
}

export interface UserImageProviderConfig {
  [key: string]: ImageProviderConfig;
}

export interface ImageProviderSettings {
  proxyUrl?: {
    desc?: string;
    placeholder: string;
    title?: string;
  } | false;
  showApiKey?: boolean;
  showModelFetcher?: boolean;
}

export interface KeyVaultsConfig {
  apiKey?: string;
  endpoint?: string;
}

export interface ImageProviderCard {
  checkModel?: string;
  description?: string;
  enabled?: boolean;
  id: GlobalImageProviderKey;
  modelsUrl?: string;
  name: string;
  settings: ImageProviderSettings;
  showConfig?: boolean;
  url: string;
} 