export interface ImagineTask {
    id: string; // Для отслеживания конкретной задачи генерации
    prompt: string;
    // Добавить другие параметры, которые были отправлены для этой задачи
    // model: string;
    // style: string;
    // ... etc.
    imageUrls: string[]; // <-- Changed from imageUrl?: string
    requestImageUrl?: string; // URL, если API возвращает его до завершения
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: any;
    createdAt: number;
  }

  export interface ImagineSettings {
    selectedModel: string;
    style: string;
    generationMode: 'fast' | 'quality' | 'ultra';
    aspectRatio: '1:1' | '2:3' | '4:3' | '9:16';
    resolution: string;
    numImages: number;
    apiKey?: string;
    apiEndpoint?: string;
  }

  export interface ImagineStoreState {
    // Настройки из SettingsPanel
    inputPrompt: string;
    settings: ImagineSettings;
    tasks: Record<string, ImagineTask>;
    currentTaskId?: string;
    history: string[]; // <-- Added history (array of task IDs)
    viewedTaskId?: string; // <-- Added state for viewed task ID

    // TODO: Добавить остальные настройки (advanced, collection) по необходимости

    // TODO: Добавить историю задач, если нужно
    // history: ImagineTask[];
  }

  export const initialImagineState: ImagineStoreState = {
    inputPrompt: '',
    settings: {
      selectedModel: 'flux-pro',
      style: 'dynamic',
      generationMode: 'quality',
      aspectRatio: '1:1',
      resolution: '1024x1024',
      numImages: 1,
      apiKey: '',
      apiEndpoint: '',
    },
    tasks: {},
    currentTaskId: undefined,
    history: [],
    viewedTaskId: undefined,
  };