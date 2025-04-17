export interface VideoProviderSettings {
  videoApiKey?: string;
  videoEndpoint?: string;
  // Add other video-specific settings if needed in the future
}

export const initialVideoProviderState: VideoProviderSettings = {
  videoApiKey: '',
  videoEndpoint: '', // Default to empty, let the task slice use the default external URL
}; 