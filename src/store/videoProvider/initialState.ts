export interface VideoProviderStoreState {
  // State related to the current video generation task
  prompt: string;
  model: string | null;
  imageBase64?: string; // Optional base64 encoded image for image-to-video
  isLoading: boolean;
  videoUrl?: string;
  error?: any;

  // State related to history (simplified for now)
  history: Array<{ id: string; prompt: string; videoUrl: string; timestamp: number }>;

  // Potentially add state for enabled models/provider configs later
}

export const initialVideoProviderState: VideoProviderStoreState = {
  prompt: '',
  model: null,
  isLoading: false,
  history: [],
}; 