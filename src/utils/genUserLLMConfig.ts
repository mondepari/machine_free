import * as ProviderCards from '@/config/modelProviders';
import { ModelProvider } from '@/libs/agent-runtime';
import { ModelProviderCard } from '@/types/llm';
import { LobeChatSettings } from '@/types/exportConfig';
import { UserSettings } from '@/types/user/settings';
import { UserModelProviderConfig } from '@/types/user/settings/modelProvider';

export const genUserLLMConfig = (
  providerConfig: Partial<UserModelProviderConfig>
): UserModelProviderConfig => {
  return Object.keys(ModelProvider).reduce((config, providerKey) => {
    const provider = ModelProvider[providerKey as keyof typeof ModelProvider];
    const currentProviderConfig = providerConfig[provider] || {};

    config[provider] = {
      enabled: currentProviderConfig.enabled !== undefined ? currentProviderConfig.enabled : false,
      fetchOnClient: currentProviderConfig.fetchOnClient,
      enabledModels: currentProviderConfig.enabledModels,
      customModelCards: currentProviderConfig.customModelCards,
      latestFetchTime: currentProviderConfig.latestFetchTime,
    };

    return config;
  }, {} as UserModelProviderConfig);
};
