import { ReactNode } from 'react';

export type GlobalImageProviderKey = string;

export interface ImageProviderConfig {
  enabled: boolean;
  enabledModels: string[];
  fetchOnClient?: boolean;
  apiKey?: string;
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
  id: GlobalImageProviderKey;
  name: string;
  description?: string;
  enabled?: boolean;
  url: string;
  settings: ImageProviderSettings;
  modelsUrl?: string;
  showConfig?: boolean;
  checkModel?: string;
} 