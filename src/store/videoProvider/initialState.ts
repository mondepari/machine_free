export interface VideoProviderStoreState {
  error?: any;
  // State related to history (simplified for now)
  history: Array<{ id: string; prompt: string; timestamp: number, videoUrl: string; }>;
  imageBase64?: string; // Optional base64 encoded image for image-to-video
  isLoading: boolean;
  model: string | null;
  // State related to the current video generation task
  prompt: string;

  videoUrl?: string;

  // Potentially add state for enabled models/provider configs later
}

export const initialVideoProviderState: VideoProviderStoreState = {
  history: [],
  isLoading: false,
  model: null,
  prompt: '',
}; 