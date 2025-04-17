import { useMemo } from 'react';
import { useSettingStore } from '@/store/settings';

export const useImageProvider = () => {
  const imageProviders = useSettingStore((s) => s.imageProviders);

  const hasActiveProvider = useMemo(() => {
    return Object.values(imageProviders).some(
      (provider) => provider.enabled && provider.apiKey && provider.proxyUrl?.title
    );
  }, [imageProviders]);

  const getProviderConfig = () => {
    const activeProvider = Object.entries(imageProviders).find(
      ([_, config]) => config.enabled
    );

    if (!activeProvider) return null;

    const [_, config] = activeProvider;

    return {
      apiKey: config.apiKey,
      apiEndpoint: config.proxyUrl?.title || '',
      isEnabled: config.enabled,
    };
  };

  return {
    getProviderConfig,
    hasActiveProvider,
  };
}; 