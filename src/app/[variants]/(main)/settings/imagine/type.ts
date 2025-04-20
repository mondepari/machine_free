
export interface ProviderItem {
  apiKey?: string;
  apiKeyItems?: string[];
  canDeactivate?: boolean;
  className?: string;
  enabled?: boolean;
  name: string;
  proxyUrl?: {
    label: string;
    placeholder: string;
  } | false;
  showApiKey?: boolean;
} 