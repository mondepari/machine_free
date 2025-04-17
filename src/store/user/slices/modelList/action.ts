import { produce } from 'immer';
import { isEqual } from 'lodash-es';
import useSWR, { SWRResponse } from 'swr';
import type { StateCreator } from 'zustand/vanilla';

import { DEFAULT_MODEL_PROVIDER_LIST } from '@/config/modelProviders';
import { ModelProvider } from '@/libs/agent-runtime';
import { UserStore } from '@/store/user';
import type { ChatModelCard, ModelProviderCard } from '@/types/llm';
import type {
  GlobalLLMProviderKey,
  UserModelProviderConfig,
} from '@/types/user/settings/modelProvider';
import type { UserKeyVaults } from '@/types/user/settings/keyVaults';

import { settingsSelectors } from '../settings/selectors';
import { CustomModelCardDispatch, customModelCardsReducer } from './reducers/customModelCard';
import { modelProviderSelectors } from './selectors/modelProvider';

/**
 * 设置操作
 */
export interface ModelListAction {
  clearObtainedModels: (provider: GlobalLLMProviderKey) => Promise<void>;
  dispatchCustomModelCards: (
    provider: GlobalLLMProviderKey,
    payload: CustomModelCardDispatch,
  ) => Promise<void>;
  /**
   * make sure the default model provider list is sync to latest state
   */
  refreshDefaultModelProviderList: (params?: { trigger?: string }) => void;
  refreshModelProviderList: (params?: { trigger?: string }) => void;
  removeEnabledModels: (provider: GlobalLLMProviderKey, model: string) => Promise<void>;
  setModelProviderConfig: <T extends GlobalLLMProviderKey>(
    provider: T,
    config: Partial<UserModelProviderConfig[T]>,
  ) => Promise<void>;
  toggleEditingCustomModelCard: (params?: { id: string; provider: GlobalLLMProviderKey }) => void;

  toggleProviderEnabled: (provider: GlobalLLMProviderKey, enabled: boolean) => Promise<void>;

  updateEnabledModels: (
    provider: GlobalLLMProviderKey,
    modelKeys: string[],
    options: { label?: string; value?: string }[],
  ) => Promise<void>;

  updateKeyVaultConfig: <T extends GlobalLLMProviderKey>(
    provider: T,
    config: Partial<UserKeyVaults[T]>,
  ) => Promise<void>;

  updateKeyVaultSettings: (key: string, config: any) => Promise<void>;

  useFetchProviderModelList: (
    provider: GlobalLLMProviderKey,
    enabledAutoFetch: boolean,
  ) => SWRResponse;
}

export const createModelListSlice: StateCreator<
  UserStore,
  [['zustand/devtools', never]],
  [],
  ModelListAction
> = (set, get) => ({
  clearObtainedModels: async (provider: GlobalLLMProviderKey) => {
    await get().setModelProviderConfig(provider, {
      remoteModelCards: [],
    });

    get().refreshDefaultModelProviderList();
  },
  dispatchCustomModelCards: async (provider, payload) => {
    const prevState = settingsSelectors.providerConfig(provider)(get());

    if (!prevState) return;

    const nextState = customModelCardsReducer(prevState.customModelCards, payload);

    await get().setModelProviderConfig(provider, { customModelCards: nextState });
  },
  refreshDefaultModelProviderList: (params) => {
    /**
     * Because we have several model cards sources, we need to merge the model cards
     * the priority is below:
     * 1 - server side model cards
     * 2 - remote model cards
     * 3 - default model cards
     */

    const mergeModels = (providerKey: GlobalLLMProviderKey, providerCard: ModelProviderCard) => {
      // if the chat model is config in the server side, use the server side model cards
      const serverChatModels = modelProviderSelectors.serverProviderModelCards(providerKey)(get());
      const remoteChatModels = providerCard.modelList?.showModelFetcher
        ? modelProviderSelectors.remoteProviderModelCards(providerKey)(get())
        : undefined;

      if (serverChatModels && serverChatModels.length > 0) {
        return serverChatModels;
      }
      if (remoteChatModels && remoteChatModels.length > 0) {
        return remoteChatModels;
      }

      return providerCard.chatModels;
    };

    const defaultModelProviderList = produce(DEFAULT_MODEL_PROVIDER_LIST, (draft) => {
      Object.values(ModelProvider).forEach((id) => {
        const provider = draft.find((d) => d.id === id);
        if (provider) provider.chatModels = mergeModels(id as any, provider);
      });
    });

    set({ defaultModelProviderList }, false, `refreshDefaultModelList - ${params?.trigger}`);

    get().refreshModelProviderList({ trigger: 'refreshDefaultModelList' });
  },
  refreshModelProviderList: (params) => {
    const modelProviderList = get().defaultModelProviderList.map((list) => {
      const enabledModels = modelProviderSelectors.getEnableModelsById(list.id)(get());
      return {
        ...list,
        chatModels: modelProviderSelectors
          .getModelCardsById(list.id)(get())
          ?.map((model) => {
            if (!enabledModels) return model;

            return {
              ...model,
              enabled: enabledModels?.some((m) => m === model.id),
            };
          }),
        enabled: modelProviderSelectors.isProviderEnabled(list.id as any)(get()),
      };
    });

    set({ modelProviderList }, false, `refreshModelList - ${params?.trigger}`);
  },

  removeEnabledModels: async (provider, model) => {
    const config = settingsSelectors.providerConfig(provider)(get());
    if (!config) return;

    const enabledModels = config?.enabledModels?.filter((s: string) => s !== model).filter(Boolean);

    await get().setModelProviderConfig(provider, { ...config, enabledModels });
  },

  setModelProviderConfig: async (provider, config) => {
    await get().setSettings({ languageModel: { [provider]: config } });
  },

  toggleEditingCustomModelCard: (params) => {
    set({ editingCustomCardModel: params }, false, 'toggleEditingCustomModelCard');
  },

  toggleProviderEnabled: async (provider, enabled) => {
    await get().setSettings({ languageModel: { [provider]: { enabled } } });

    // if enable provider, try to fetch model list
    if (enabled) {
      // await get().refreshModelList(provider); // Commented out problematic line
    }
  },
  updateEnabledModels: async (provider, models) => {
    const config = settingsSelectors.providerConfig(provider)(get());

    // check if the models are already enabled
    if (isEqual(config?.enabledModels, models)) return;

    await get().setModelProviderConfig(provider, { ...config, enabledModels: models });
  },

  updateKeyVaultConfig: async (provider, config) => {
    await get().setSettings({ keyVaults: { [provider]: config } });
  },

  updateKeyVaultSettings: async (provider, config) => {
    await get().setSettings({ keyVaults: { [provider]: config } });
  },

  useFetchProviderModelList: (provider, enabledAutoFetch) =>
    useSWR<ChatModelCard[] | undefined>(
      [provider, enabledAutoFetch],
      async ([p]) => {
        const { modelsService } = await import('@/services/models');

        return modelsService.getChatModels(p);
      },
      {
        onSuccess: async (data) => {
          if (data) {
            await get().setModelProviderConfig(provider, {
              latestFetchTime: Date.now(),
              remoteModelCards: data,
            });

            get().refreshDefaultModelProviderList();
          }
        },
        revalidateOnFocus: false,
        revalidateOnMount: enabledAutoFetch,
      },
    ),
});
