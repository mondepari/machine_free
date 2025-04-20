import type { ImagineStore } from './store';
import { ImagineTask, ImagineSettings } from './initialState';

// Selector for the entire store state (if needed)
const selectImagineStore = (s: ImagineStore) => s;

// Selector for the current input prompt value
const selectInputPrompt = (s: ImagineStore) => s.inputPrompt;

// Selector for the current settings object
const selectImagineSettings = (s: ImagineStore): ImagineSettings => s.settings;

// Selector for the generation status (derived from the current task)
const selectIsGenerating = (s: ImagineStore): boolean => {
  if (!s.currentTaskId) return false;
  const task = s.tasks[s.currentTaskId];
  return task?.status === 'pending' || task?.status === 'processing';
};

// Selector for the current task object
const selectCurrentTask = (s: ImagineStore): ImagineTask | undefined => {
  if (!s.currentTaskId) return undefined;
  return s.tasks[s.currentTaskId];
};

// Selector for the task history (returns an array of Task objects)
const selectHistory = (s: ImagineStore): ImagineTask[] => {
  // Map history IDs to task objects, filter out any potential undefined/null values
  return s.history.map(taskId => s.tasks[taskId]).filter(Boolean) as ImagineTask[];
};

// Selector for the currently viewed task from history
const selectViewedTask = (s: ImagineStore): ImagineTask | undefined => {
  if (!s.viewedTaskId) return undefined;
  return s.tasks[s.viewedTaskId];
};

// {{ ЭКСПОРТ ПРИСУТСТВУЕТ }}
export const imagineSelectors = {
  selectCurrentTask,
  selectHistory,
  selectImagineSettings,
  selectImagineStore,
  selectInputPrompt,
  selectIsGenerating,
  selectViewedTask,
};