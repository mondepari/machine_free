import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { StateCreator } from 'zustand/vanilla';

import { createDevtools } from '../middleware/createDevtools';
import { type ImagineStoreActions, imagineActionSlice } from './actions';
import { type ImagineStoreState, initialImagineState } from './initialState';

//  Объединяем State и Actions
export interface ImagineStore extends ImagineStoreState, ImagineStoreActions {}

// Функция для создания стора
const createImagineStore: StateCreator<ImagineStore, [['zustand/devtools', never]]> = (
  ...parameters
) => ({
  ...initialImagineState,
  ...imagineActionSlice(...parameters),
});

// Создаем сам хук useImagineStore
const devtools = createDevtools('imagine');

export const useImagineStore = createWithEqualityFn<ImagineStore>()(
  subscribeWithSelector(devtools(createImagineStore)),
  shallow,
);

// {{ === Добавьте этот тестовый экспорт === }}
export const testExportValue = 'Hello from store!';
// {{ ==================================== }}