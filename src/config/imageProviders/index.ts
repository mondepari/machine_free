import { ImageProviderCard } from '@/types/imagine/settings';

export const DefaultProvider: ImageProviderCard = {
  id: 'default',
  name: 'Default Provider',
  description: 'Default image generation provider with standard API endpoints',
  enabled: true,
  url: 'https://api.example.com',
  settings: {
    showApiKey: true,
    showModelFetcher: true,
    proxyUrl: {
      title: 'API URL',
      desc: 'Enter the API endpoint URL for the default provider',
      placeholder: 'https://api.example.com/v1',
    },
  },
  checkModel: 'default-model',
};

export const CustomProvider: ImageProviderCard = {
  id: 'custom',
  name: 'Custom Provider',
  description: 'Configure your own image generation provider with custom API endpoints',
  enabled: false,
  url: '',
  settings: {
    showApiKey: true,
    showModelFetcher: true,
    proxyUrl: {
      title: 'API URL',
      desc: 'Enter your custom API endpoint URL',
      placeholder: 'https://your-api-endpoint.com/v1',
    },
  },
};

export const DEFAULT_IMAGE_PROVIDER_LIST = [
  DefaultProvider,
  CustomProvider,
];

export const filterEnabledModels = (provider: ImageProviderCard): string[] => {
  return provider.settings.showModelFetcher ? [] : [];
};

export const isProviderDisableBrowserRequest = (provider: ImageProviderCard): boolean => {
  return false;
}; 