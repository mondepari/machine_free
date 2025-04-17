import { FormItemProps } from '@lobehub/ui';

export interface ProviderItem {
  name: string;
  apiKeyItems?: string[];
  proxyUrl?: {
    label: string;
    placeholder: string;
  } | false;
  showApiKey?: boolean;
  canDeactivate?: boolean;
  className?: string;
  enabled?: boolean;
  apiKey?: string;
} 