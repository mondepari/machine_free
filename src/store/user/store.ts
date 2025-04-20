import { subscribeWithSelector , persist, PersistOptions } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { StateCreator } from 'zustand/vanilla';


import { createDevtools } from '../middleware/createDevtools';
import { type UserState, initialState } from './initialState';
import { createAuthSlice } from './slices/auth/action';
import { type CommonAction, createCommonSlice } from './slices/common/action';
import { type ImageProviderAction, createImageProviderSlice } from './slices/imageProvider/action';
import { type ModelListAction, createModelListSlice } from './slices/modelList/action';
import { type PreferenceAction, createPreferenceSlice } from './slices/preference/action';
import { type UserSettingsAction, createSettingsSlice } from './slices/settings/action';
import { type UserSettings } from '@/types/user/settings';
import { type SyncAction, createSyncSlice } from './slices/sync/action';
import { VideoProviderAction, createVideoProviderSlice } from './slices/videoProvider/action';
import type { VideoProviderSettings } from './slices/videoProvider/initialState';

//  ===============  聚合 createStoreFn ============ //

export interface UserStore
  extends CommonAction,
    PreferenceAction,
    SyncAction,
    UserSettingsAction,
    ImageProviderAction,
    VideoProviderAction,
    ModelListAction,
    UserState {
      settings: UserSettings & { videoProvider: VideoProviderSettings };
    }

const createStore: StateCreator<UserStore, [['zustand/devtools', never]]> = (...parameters) => ({
  ...initialState,
  ...createSyncSlice(...parameters),
  ...createSettingsSlice(...parameters),
  ...createPreferenceSlice(...parameters),
  ...createAuthSlice(...parameters),
  ...createCommonSlice(...parameters),
  ...createModelListSlice(...parameters),
  ...createImageProviderSlice(...parameters),
  ...createVideoProviderSlice(...parameters),
});

// Define the partial state to persist - corrected keys
type UserStorageSyncState = Pick<UserStore, 'preference' | 'settings' | 'modelProviderList'>;

const persistOptions: PersistOptions<UserStore, UserStorageSyncState> = {
  name: 'lobe-user-store', // name of the item in the storage (must be unique)

  // Define which parts of the state to persist
  partialize: (state) =>
    ({
      // Ensure settings object is persisted
modelProviderList: state.modelProviderList,
      
preference: state.preference, 
      settings: state.settings,
    }) as UserStorageSyncState,

  // version: 1, // uncomment and increment if you change the storage structure
  // skipHydration: true, // uncomment if you want to handle hydration manually
  // migrate: (persistedState, version) => { ... } // Handle migrations
};

//  ===============  实装 useStore ============ //

const devtoolsEnhancer = createDevtools('user');

export const useUserStore = createWithEqualityFn<UserStore>()(
  subscribeWithSelector(
    persist(
        devtoolsEnhancer(createStore),
        persistOptions // Use the defined options
    )
  ),
  shallow,
);

export const getUserStoreState = () => useUserStore.getState();
