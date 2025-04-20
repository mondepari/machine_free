export interface ImagineTask {
    createdAt: number; 
    error?: any;
    id: string; 
    // Добавить другие параметры, которые были отправлены для этой задачи
// model: string;
// style: string;
// ... etc.
    imageUrls: string[]; 
    // Для отслеживания конкретной задачи генерации
    prompt: string;
    // <-- Changed from imageUrl?: string
    requestImageUrl?: string;
    // URL, если API возвращает его до завершения
    status: 'pending' | 'processing' | 'success' | 'error';
  }

  export interface ImagineSettings {
    apiEndpoint?: string;
    apiKey?: string;
    aspectRatio: '1:1' | '2:3' | '4:3' | '9:16';
    generationMode: 'fast' | 'quality' | 'ultra';
    numImages: number;
    resolution: string;
    selectedModel: string;
    style: string;
  }

  export interface ImagineStoreState {
    currentTaskId?: string;
    history: string[];
    // Настройки из SettingsPanel
    inputPrompt: string;
    settings: ImagineSettings;
    tasks: Record<string, ImagineTask>; // <-- Added history (array of task IDs)
    viewedTaskId?: string; // <-- Added state for viewed task ID

    // TODO: Добавить остальные настройки (advanced, collection) по необходимости

    // TODO: Добавить историю задач, если нужно
    // history: ImagineTask[];
  }

  export const initialImagineState: ImagineStoreState = {
    currentTaskId: undefined,
    history: [],
    inputPrompt: '',
    settings: {
      apiEndpoint: '',
      aspectRatio: '1:1',
      apiKey: '',
      generationMode: 'quality',
      numImages: 1,
      resolution: '1024x1024',
      selectedModel: 'flux-pro',
      style: 'dynamic',
    },
    tasks: {},
    viewedTaskId: undefined,
  };