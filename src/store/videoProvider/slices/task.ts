import type { StateCreator } from 'zustand/vanilla';
import { UploadFile } from 'antd/es/upload/interface';
import { nanoid } from 'nanoid';

// Imports needed for saving to storage (mirrored from imagine store)
import { ClientService } from '@/services/file/client';
import { fileEnv } from '@/config/file';
import { clientS3Storage } from '@/services/file/ClientS3'; // Assuming direct S3 client is used sometimes
import { userProfileSelectors } from '@/store/user/selectors';
import { useUserStore } from '@/store/user';

import { VideoProviderStore } from '../store';
// No longer importing useUserStore here as it's imported above for saving

// Define the state structure for this slice
export interface VideoTaskAction {
  setPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setImageFile: (file: UploadFile | null) => void;
  generateVideo: () => Promise<void>; // Action to trigger the generation
  // Internal actions (optional, might be called by generateVideo)
  _setLoading: (isLoading: boolean) => void;
  _setVideoUrl: (url: string | undefined) => void;
  _setError: (error: any) => void;
  _addToHistory: (result: { prompt: string; videoUrl: string }) => void;
}

// Helper function to convert file to base64 (if needed for API)
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// --- Function to save video to LobeChat's storage --- //
const saveVideoToStorage = async (videoUrl: string, prompt: string, model: string): Promise<string> => {
  try {
    console.log(`Attempting to save video from URL: ${videoUrl}`);
    // Get current user ID from the store
    const userId = userProfileSelectors.userId(useUserStore.getState());
    if (!userId) {
      console.error('User not authenticated, cannot save video to storage.');
      return videoUrl;
    }

    // Fetch the video from the temporary URL
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video from temporary URL: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const fileType = blob.type || 'video/mp4';
    const fileExtension = fileType.split('/')[1] || 'mp4';
    const fileName = `generated-video-${Date.now()}.${fileExtension}`;
    const file = new File([blob], fileName, { type: fileType });
    const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const fileHash = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create file metadata
    const fileData = {
      fileHash,
      fileType: file.type,
      name: file.name,
      size: file.size,
      url: `client-s3://${fileHash}`,
      metadata: { prompt, generated: true, model }
    };

    console.log('Video file metadata prepared:', fileData);

    // --- Save using ClientService (interacts with backend API) --- //
    const clientService = new ClientService(userId);
    const { isExist } = await clientService.checkFileHash(fileHash);
    console.log(`File hash ${fileHash} exists check result:`, isExist);
    const result = await clientService.createFile(fileData, isExist ? 'skip' : 'insert');
    console.log('File creation result:', result);

    // Return the persistent URL provided by the backend/ClientService
    if (!result.url) {
        throw new Error('Backend did not return a valid URL after file creation.');
    }
    console.log(`Video saved successfully. Persistent URL: ${result.url}`);
    return result.url;

  } catch (error) {
    console.error('Failed to save video to LobeChat storage:', error);
    return videoUrl; // Fallback to original temporary URL
  }
};
// --- End saveVideoToStorage --- //

export const createVideoTaskSlice: StateCreator<
  VideoProviderStore,
  [['zustand/devtools', never]],
  [],
  VideoTaskAction
> = (set, get) => ({
  setPrompt: (prompt) => {
    set({ prompt }, false, 'setPrompt');
  },
  setModel: (model) => {
    set({ model }, false, 'setModel');
  },
  setImageFile: async (file) => {
    if (file && file.originFileObj) {
      try {
        const base64 = await fileToBase64(file.originFileObj);
        set({ imageBase64: base64 }, false, 'setImageFile');
      } catch (error) {
        console.error('Error converting file to base64:', error);
        set({ imageBase64: undefined }, false, 'setImageFile'); // Clear on error
      }
    } else {
      set({ imageBase64: undefined }, false, 'setImageFile'); // Clear if no file
    }
  },
  _setLoading: (isLoading) => {
    set({ isLoading }, false, 'setLoading');
  },
  _setVideoUrl: (url) => {
    set({ videoUrl: url, error: undefined }, false, 'setVideoUrl'); // Clear error on success
  },
  _setError: (error) => {
    set({ error, isLoading: false, videoUrl: undefined }, false, 'setError'); // Clear url on error
  },
  _addToHistory: (result) => {
    const newHistoryItem = {
      id: nanoid(),
      prompt: result.prompt,
      videoUrl: result.videoUrl,
      timestamp: Date.now(),
    };
    set((state) => ({ history: [newHistoryItem, ...state.history] }), false, 'addToHistory');
  },
  generateVideo: async () => {
    console.log('[generateVideo] Action started.');
    let stateSnapshot;
    try {
      stateSnapshot = get();
      console.log('[generateVideo] State snapshot retrieved:', stateSnapshot);
    } catch (e: any) {
      console.error('[generateVideo] Failed to get state snapshot:', e);
      return;
    }

    const { prompt, model, _setLoading, _setVideoUrl, _setError, _addToHistory } = stateSnapshot;

    // --- Get API settings from user store --- //
    let userSettings;
    let videoApiKey;
    let videoEndpoint;
    try {
      userSettings = useUserStore.getState().settings;
      videoApiKey = userSettings?.videoProvider?.videoApiKey;
      videoEndpoint = userSettings?.videoProvider?.videoEndpoint;
      console.log('[generateVideo] User settings retrieved:', { videoApiKey, videoEndpoint });
    } catch (e: any) {
      console.error('[generateVideo] Failed to get user settings:', e);
      try {
        _setError('Internal error: Failed to read user settings.');
        _setLoading(false);
      } catch (innerErr) {
        console.error('[generateVideo] Also failed to set error state after failing to get user settings:', innerErr);
      }
      return;
    }

    const resolvedVideoEndpoint = videoEndpoint || 'https://api.electronhub.top/v1/videos/generations'; // Still need this for validation if needed
    console.log('[generateVideo] Target external endpoint:', resolvedVideoEndpoint);

    // --- Initial Checks --- //
    if (!prompt || !model) {
      const errorMsg = 'Prompt and model are required.';
      console.log('[generateVideo] Validation failed:', errorMsg);
      try { _setError(errorMsg); _setLoading(false); } catch (e: any) { console.error('[generateVideo] Failed to set error:', e); }
      return;
    }
    console.log('[generateVideo] Prompt and model checks passed.');

    // API Key check (using resolvedVideoEndpoint for context)
    if (resolvedVideoEndpoint.includes('electronhub') && !videoApiKey) {
      const errorMsg = 'API Key is missing for electronhub. Please configure it in settings.';
      console.log('[generateVideo] Validation failed:', errorMsg);
      try { _setError(errorMsg); _setLoading(false); } catch (e: any) { console.error('[generateVideo] Failed to set error:', e); }
      return;
    }
    console.log('[generateVideo] API key check passed (if applicable).');

    // --- Set Loading States --- //
    try {
      _setLoading(true);
      _setVideoUrl(undefined);
      _setError(undefined);
      console.log('[generateVideo] Loading states set.');
    } catch (e: any) {
      console.error('[generateVideo] Failed to set loading states:', e);
      return;
    }

    let temporaryVideoUrl = '';

    try {
      // --- Stage 1: Call Internal Proxy API --- //
      const proxyEndpoint = '/api/video/proxy';
      console.log(`[generateVideo] Calling internal proxy: ${proxyEndpoint}`);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Send necessary info TO the proxy
      const payload = {
        model: model,
        prompt: prompt,
        videoApiKey: videoApiKey, // Send key to proxy
        videoEndpoint: resolvedVideoEndpoint // Send target endpoint to proxy
      };
      console.log('[generateVideo] Proxy Payload:', payload);

      const response = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      });
      console.log('[generateVideo] Proxy Response Status:', response.status);

      const result = await response.json(); // Expect JSON from our proxy

      if (!response.ok) {
         // Error came from our proxy (could be validation or forwarded external error)
         console.error('[generateVideo] Proxy returned error:', result);

         // --- Improved Error Message Handling ---
         let detailedError = result.details || result.message || 'No details provided by proxy.';
         // Check if the details look like the Cloudflare HTML timeout page
         if (typeof detailedError === 'string' && detailedError.includes('A timeout occurred') && detailedError.includes('Error code 524')) {
            detailedError = 'The external video generation service (api.electronhub.top) timed out (Error 524). This might be due to high load or a long-running request. Please try again later or with a simpler prompt.';
         } else if (typeof detailedError === 'object'){
            detailedError = JSON.stringify(detailedError);
         }

         const errorMsg = result?.error ? `${result.error}: ${detailedError}` : 'Proxy error';
         // --- End Improved Error Message Handling ---

         throw new Error(errorMsg);
      }

      console.log('[generateVideo] Proxy Response Success JSON:', result);
      temporaryVideoUrl = result?.data?.[0]?.url; // Assuming same structure from external API via proxy
      if (!temporaryVideoUrl) {
        throw new Error('Temporary video URL not found in proxy response');
      }
      console.log(`[generateVideo] Temporary video URL received via proxy: ${temporaryVideoUrl}`);

      // --- Stage 2 & 3 remain the same --- //
      const persistentVideoUrl = await saveVideoToStorage(temporaryVideoUrl, prompt, model);
      _setVideoUrl(persistentVideoUrl);
      _addToHistory({ prompt, videoUrl: persistentVideoUrl });
      console.log('[generateVideo] Video generation and saving successful.');

    } catch (error: any) {
      console.error('[generateVideo] Video generation process failed:', error);
      try {
         // Use the potentially improved error message from the caught error
        _setError(error.message || 'An unknown error occurred during video generation.');
      } catch (e: any) {
         console.error('[generateVideo] Failed to set error after generation failure:', e);
      }
      if (temporaryVideoUrl && !get().videoUrl) {
         _setVideoUrl(undefined);
      }
    } finally {
      console.log('[generateVideo] Entering finally block.');
      try{
        _setLoading(false);
        console.log('[generateVideo] Loading set to false in finally block.');
      } catch(e: any) {
        console.error('[generateVideo] Failed to set loading to false in finally block:', e);
      }
    }
    console.log('[generateVideo] Action finished.');
  },
}); 