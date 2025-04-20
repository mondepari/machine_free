import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { StateCreator } from 'zustand/vanilla';
// import { DevtoolsOptions, devtools } from 'zustand/middleware'; // Removed devtools
import { VideoProviderStoreState, initialVideoProviderState } from './initialState';
import { VideoTaskAction, createVideoTaskSlice } from './slices/task';

// ================== Store Definition ================== //

export interface VideoProviderStore extends VideoProviderStoreState, VideoTaskAction {}

// ================== createStore ================== //

// Define the core creator function without devtools signature
const creator: StateCreator<VideoProviderStore, []> = (...parameters) => ({
  ...initialVideoProviderState,
  ...createVideoTaskSlice(...parameters),
});

// ================== Hook ================== //

// Apply only equality function middleware
export const useVideoProviderStore = createWithEqualityFn<VideoProviderStore>()(
  creator, // No devtools wrapping
  shallow,
);

// We can potentially re-add middleware later if the basic store works:
/*
export const useVideoProviderStore = createWithEqualityFn<VideoProviderStore>()(
  createDevtools(createStore, {
    name: 'VID_PROVIDER' + (isDev ? '_DEV' : ''),
  }),
  shallow,
);
*/ 