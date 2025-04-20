import { ImageProviderCard } from '@/types/imagine/settings';

export const DefaultProvider: ImageProviderCard = {
  checkModel: 'default-model',
  description: 'Default image generation provider with standard API endpoints',
  enabled: true,
  id: 'default',
  name: 'Default Provider',
  settings: {
    proxyUrl: {
      desc: 'Enter the API endpoint URL for the default provider',
      placeholder: 'https://api.example.com/v1',
      title: 'API URL',
    },
    showApiKey: true,
    showModelFetcher: true,
  },
  url: 'https://api.example.com',
};

export const CustomProvider: ImageProviderCard = {
  description: 'Configure your own image generation provider with custom API endpoints',
  enabled: false,
  id: 'custom',
  name: 'Custom Provider',
  settings: {
    proxyUrl: {
      desc: 'Enter your custom API endpoint URL',
      placeholder: 'https://your-api-endpoint.com/v1',
      title: 'API URL',
    },
    showApiKey: true,
    showModelFetcher: true,
  },
  url: '',
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