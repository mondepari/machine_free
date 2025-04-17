import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand/vanilla';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

import type { ImagineStore } from './store';
import { useImagineStore } from './store';
import { ImagineStoreState, ImagineTask, ImagineSettings } from './initialState';
import { ClientService } from '@/services/file/client';
import { fileEnv } from '@/config/file';
import { clientS3Storage } from '@/services/file/ClientS3';
import { userProfileSelectors } from '@/store/user/selectors';
import { useUserStore } from '@/store/user';

// Оставляем только интерфейс с одним простым методом
export interface ImagineStoreActions {
  updateSettings: (settings: Partial<ImagineSettings>) => void;
  setInputPrompt: (prompt: string) => void;
  generateImage: () => Promise<void>; // Асинхронный экшен
  viewTaskFromHistory: (taskId: string) => void; // <-- Add action type
  deleteTask: (taskId: string) => void;
  // Другие экшены по необходимости (например, для истории)
}

// Оставляем только один простой экшен в срезе
export const imagineActionSlice: StateCreator<
  ImagineStore,
  [['zustand/devtools', never]],
  [],
  ImagineStoreActions
> = (set, get) => ({
  updateSettings: (settings) => {
    set(
      (state: ImagineStore) => ({ settings: { ...state.settings, ...settings } }),
      false,
      'updateSettings',
    );
  },

  setInputPrompt: (prompt) => {
    set({ inputPrompt: prompt }, false, 'setInputPrompt');
  },

  generateImage: async () => {
    const { inputPrompt, settings } = get();
    if (!inputPrompt) return;

    // Clear the viewed task when starting a new generation
    set({ viewedTaskId: undefined }, false, 'generateImage/clearViewed');

    const { apiKey, apiEndpoint, selectedModel, numImages, resolution, style } = settings;

    const taskId = nanoid();
    const newTask: ImagineTask = {
      id: taskId,
      prompt: inputPrompt,
      status: 'pending',
      createdAt: Date.now(),
      imageUrls: [],
    };

    set(
      (state) => ({
        tasks: { ...state.tasks, [taskId]: newTask },
        currentTaskId: taskId,
        history: [taskId, ...state.history.filter(id => id !== taskId)],
      }),
      false,
      'generateImage/pending',
    );

    try {
      set(
        (state) => ({
          tasks: { ...state.tasks, [taskId]: { ...state.tasks[taskId], status: 'processing' } },
        }),
        false,
        'generateImage/processing',
      );

      let imageUrls: string[] = [];

      if (!apiEndpoint || !apiKey) {
        // --- Fallback to placeholder if API not configured ---
        console.warn('API Endpoint or Key not configured. Using placeholder images.');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Generate multiple unique placeholder URLs
        imageUrls = Array.from({ length: numImages }, (_, i) => 
          `https://image.pollinations.ai/prompt/${encodeURIComponent(inputPrompt)}?seed=${i}&time=${Date.now()}`
        );
      } else {
        // --- Actual API Call Logic ---
        let cleanEndpoint = apiEndpoint.trim();
        if (!cleanEndpoint.startsWith('http://') && !cleanEndpoint.startsWith('https://')) {
          cleanEndpoint = `https://${cleanEndpoint}`;
          console.warn(`API Endpoint did not have a protocol, defaulting to https. Endpoint used: ${cleanEndpoint}`);
        }
        cleanEndpoint = cleanEndpoint.replace(/\/+$/, '');

        const apiUrl = `${cleanEndpoint}/v1/images/generations`;

        // Create an array of unique seeds for each image
        const seeds = Array.from({ length: numImages }, (_, i) => 
          Math.floor(Math.random() * 1000000) + i * 1000000
        );

        // Create separate requests for each image with different seeds
        const imagePromises = seeds.map(async (seed) => {
          const payload = {
            model: selectedModel,
            prompt: inputPrompt,
            n: 1, // Generate one image per request
            size: resolution,
            style: style,
            seed: seed, // Add unique seed
            response_format: 'url',
          };

          console.log('Generating image with payload:', {
            ...payload,
            apiEndpoint: cleanEndpoint,
            apiKeyLength: apiKey?.length || 0,
          });

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            let errorDetails = `API request failed with status ${response.status}`;
            try {
              const errorData = await response.json();
              errorDetails = errorData.detail || errorData.message || JSON.stringify(errorData);
            } catch (e) { /* Ignore parsing error */ }
            throw new Error(errorDetails);
          }

          const result = await response.json();
          console.log('API Response for seed', seed, ':', result);

          // Extract URL from the response
          let imageUrl = '';
          if (result.data && Array.isArray(result.data)) {
            imageUrl = result.data[0]?.url || result.data[0]?.image_url || result.data[0];
          } else if (Array.isArray(result)) {
            imageUrl = result[0]?.url || result[0]?.image_url || result[0];
          } else if (typeof result === 'object') {
            if (result.urls) {
              imageUrl = Array.isArray(result.urls) ? result.urls[0] : result.urls;
            } else if (result.images) {
              const image = Array.isArray(result.images) ? result.images[0] : result.images;
              imageUrl = typeof image === 'string' ? image : image?.url || image?.image_url;
            } else if (result.output) {
              imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
            } else if (result.generated_images) {
              imageUrl = Array.isArray(result.generated_images) ? result.generated_images[0] : result.generated_images;
            } else {
              const possibleUrlKeys = ['url', 'image_url', 'generated_image', 'output'];
              for (const key of possibleUrlKeys) {
                if (result[key]) {
                  imageUrl = Array.isArray(result[key]) ? result[key][0] : result[key];
                  break;
                }
              }
            }
          }

          if (!imageUrl) {
            console.error('Could not extract image URL from API response:', result);
            throw new Error('No valid image URL found in the API response');
          }

          return imageUrl;
        });

        try {
          // Wait for all image generation requests to complete
          imageUrls = await Promise.all(imagePromises);
          console.log('Successfully generated all images:', imageUrls);
        } catch (error) {
          console.error('Error generating multiple images:', error);
          throw error;
        }

        if (imageUrls.length === 0) {
          throw new Error('No valid image URLs were generated');
        }

        // Ensure we have the requested number of images
        if (imageUrls.length < numImages) {
          console.warn(`API returned fewer images than requested (got ${imageUrls.length}, wanted ${numImages})`);
          // Duplicate the last image to meet the requested count if necessary
          while (imageUrls.length < numImages) {
            imageUrls.push(imageUrls[imageUrls.length - 1]);
          }
        } else if (imageUrls.length > numImages) {
          console.warn(`API returned more images than requested, truncating to ${numImages}`);
          imageUrls = imageUrls.slice(0, numImages);
        }

        console.log('Successfully processed image URLs:', imageUrls);
      }

      // After successful image generation, save images to storage
      const savedImageUrls = await Promise.all(
        imageUrls.map((url, index) => saveImageToStorage(url, inputPrompt, index))
      );

      // Update task with saved image URLs
      set(
        (state) => ({
          tasks: {
            ...state.tasks,
            [taskId]: { ...state.tasks[taskId], status: 'success', imageUrls: savedImageUrls },
          },
        }),
        false,
        'generateImage/success',
      );
    } catch (error: any) {
      console.error('Image generation failed:', error);
      set(
        (state) => ({
          tasks: {
            ...state.tasks,
            [taskId]: { ...state.tasks[taskId], status: 'error', error: { message: error.message || 'Unknown error' }, imageUrls: [] },
          },
        }),
        false,
        'generateImage/error',
      );
    }
  },

  viewTaskFromHistory: (taskId) => { // <-- Add action implementation
    set({ viewedTaskId: taskId }, false, 'viewTaskFromHistory');
  },

  deleteTask: (taskId) => {
    set(
      (state) => {
        const newTasks = { ...state.tasks };
        delete newTasks[taskId];
        return {
          tasks: newTasks,
          viewedTaskId: state.viewedTaskId === taskId ? undefined : state.viewedTaskId,
          history: state.history.filter(id => id !== taskId),
        };
      },
      false,
      'deleteTask',
    );
  },
});

// Add new function to save image to storage
const saveImageToStorage = async (imageUrl: string, prompt: string, index: number): Promise<string> => {
  try {
    // Get current user ID from the store
    const userId = userProfileSelectors.userId(useUserStore.getState());
    if (!userId) {
      console.error('User not authenticated');
      return imageUrl; // Return original URL if user is not authenticated
    }

    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Create a file object
    const file = new File([blob], `generated-${Date.now()}-${index}.png`, { type: 'image/png' });
    
    // Generate a unique hash for the file
    const hash = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const fileHash = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Get current settings from store
    const { settings } = useImagineStore.getState();

    // Create file metadata
    const fileData = {
      fileHash,
      fileType: 'image/png',
      name: file.name,
      size: file.size,
      url: `client-s3://${fileHash}`,
      metadata: {
        prompt,
        generated: true,
        index,
        model: settings.selectedModel,
        resolution: settings.resolution,
        style: settings.style
      }
    };

    // Save to local storage if no S3 configured
    if (!fileEnv.S3_ACCESS_KEY_ID || !fileEnv.S3_BUCKET) {
      await clientS3Storage.putObject(fileHash, file);
      return URL.createObjectURL(file);
    }

    // Save to S3 if configured
    const clientService = new ClientService(userId);
    
    // First check if file already exists in global_files
    const { isExist } = await clientService.checkFileHash(fileHash);
    
    // Create file with insertToGlobalFiles flag if it doesn't exist
    const result = await clientService.createFile(fileData, isExist ? 'skip' : 'insert');
    
    // Return the URL from the result
    return result.url;
  } catch (error) {
    console.error('Failed to save image to storage:', error);
    return imageUrl; // Return original URL if storage fails
  }
};

console.log('--- actions.ts loaded (simplified) ---'); // Добавим лог загрузки модуля