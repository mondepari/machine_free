// src/libs/musicapi.ts
import { MusicAPIErrorResponse, MusicAPICreateTaskResponse, MusicAPITaskStatusResponse, MusicAPIUploadResponse } from '@/types/musicapi';

// --- Configuration ---
const MUSIC_API_BASE_URL = process.env.MUSIC_API_BASE_URL;
const API_KEY = process.env.MUSIC_API_KEY;

if (!MUSIC_API_BASE_URL) {
  console.error('CRITICAL: MUSIC_API_BASE_URL environment variable is not set.');
  // Depending on the setup, you might want to throw an error here
  // throw new Error('CRITICAL: MUSIC_API_BASE_URL environment variable is not set.');
}
if (!API_KEY) {
  console.error('CRITICAL: MUSIC_API_KEY environment variable is not set.');
  // Depending on the setup, you might want to throw an error here
  // throw new Error('CRITICAL: MUSIC_API_KEY environment variable is not set.');
}

// --- Internal Helper Function ---
// Not exported - only used within this module
const fetchMusicAPI = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET', // Explicitly allow GET or POST
  body?: Record<string, any>
): Promise<T> => {
  if (!MUSIC_API_BASE_URL || !API_KEY) {
    throw new Error('Music API base URL or API key is not configured.');
  }

  const url = `${MUSIC_API_BASE_URL}${endpoint}`;
  console.log(`[fetchMusicAPI] Fetching: ${method} ${url}`);

  const headers: HeadersInit = {
    'Authorization': `Bearer ${API_KEY}`,
    // Only add Content-Type for POST requests with a body
    ...(method === 'POST' && body && { 'Content-Type': 'application/json' }),
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
    console.log(`[fetchMusicAPI] Request Body:`, JSON.stringify(body, null, 2)); // Log body for POST
  }

  try {
    const response = await fetch(url, options);

    console.log(`[fetchMusicAPI] Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorBody: MusicAPIErrorResponse | string = `HTTP error ${response.status}: ${response.statusText}`;
      let detail = 'No specific error detail provided.';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorBody = await response.json();
          console.error('[fetchMusicAPI] Error Response Body (JSON):', errorBody);
          // Extract detail message more robustly
          detail = (errorBody as any)?.detail || (errorBody as any)?.message || (errorBody as any)?.error || detail;
        } else {
          const textBody = await response.text();
          console.error('[fetchMusicAPI] Error Response Body (Text):', textBody);
          errorBody = textBody;
          detail = textBody.substring(0, 200) || detail; // Limit length of text detail
        }
      } catch (parseError) {
        console.error('[fetchMusicAPI] Failed to parse error response body:', parseError);
      }
      throw new Error(`MusicAPI request failed: ${response.status} ${response.statusText}. ${detail}`);
    }

    // Handle empty successful responses (204 or Content-Length: 0)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      console.log('[fetchMusicAPI] Received empty successful response.');
      // Return an empty object cast to T. Caller needs to be aware this might happen.
      return {} as T;
    }

    // Parse JSON for successful responses with content
    try {
      const data = await response.json();
      console.log('[fetchMusicAPI] Successful Response Body:', data);
      return data as T;
    } catch (jsonError) {
      console.error('[fetchMusicAPI] Failed to parse successful JSON response:', jsonError);
      throw new Error('Failed to parse successful JSON response from MusicAPI');
    }

  } catch (error) {
    console.error(`[fetchMusicAPI] Fetch error for ${method} ${url}:`, error);
    // Ensure error is an Error object
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error));
    }
  }
};

// --- Exported API Methods ---

/**
 * Creates a music generation task.
 * @param body The request body containing task details (model, config, input).
 * @param model The model being used ('sonic' or 'studio').
 * @param taskType The type of task ('generate_music' or 'generate_music_custom').
 * @returns The response containing the task ID.
 */
export const createMusicTask = async (
  body: Record<string, any>,
  model: string,
  taskType: string
): Promise<MusicAPICreateTaskResponse> => {
  // --- ADDED DEBUG LOGGING ---
  console.log(`[createMusicTask ENTRY] Received body:`, JSON.stringify(body, null, 2));
  console.log(`[createMusicTask ENTRY] Received model:`, model);
  console.log(`[createMusicTask ENTRY] Received taskType:`, taskType);
  // --- END DEBUG LOGGING ---

  let endpoint = '';
  let fullEndpoint = ''; // Variable for the final path

  // Determine the correct endpoint base path based on model
  if (model === 'sonic') {
    // Path based on successful Postman test
    endpoint = '/sonic/create';
    // Add required parameters for Sonic flat structure if not already in body
    body.model = model; // Or specific version like 'sonic-v3-5' if needed directly in body
    body.mv = body.mv || 'sonic-v3-5'; // Default Sonic model version if not provided
    body.task_type = taskType; // Keep task_type as it might be needed
  } else if (model === 'studio') {
    // ASSUMPTION: Studio might follow a similar pattern. VERIFY THIS PATH.
    endpoint = '/studio/create';
    body.model = model;
    body.task_type = taskType;
    // Add other required fields for Studio flat structure
  } else {
    console.error(`[createMusicTask] ERROR - Unsupported model specified: ${model}`);
    throw new Error(`Unsupported model for music creation: ${model}`);
  }

  // Prepend the /api/v1 prefix
  fullEndpoint = `/api/v1${endpoint}`;

  console.log(`[createMusicTask] Using full endpoint: ${fullEndpoint} for model: ${model}, taskType: ${taskType}`);

  // Call the internal helper with POST method and the FLAT body
  const responseData = await fetchMusicAPI<MusicAPICreateTaskResponse>(fullEndpoint, 'POST', body);

  // Basic validation for task_id presence
  if (!responseData || typeof responseData.task_id !== 'string' || !responseData.task_id) {
    console.error('[createMusicTask] Invalid response structure received (missing or invalid task_id):', responseData);
    throw new Error('MusicAPI create task response did not include a valid task_id.');
  }

  return responseData;
};

/**
 * Gets the status of a music generation task.
 * @param taskId The ID of the task to check.
 * @param model The model used for the task ('sonic' or 'studio').
 * @returns The response containing the task status and potentially results.
 */
export const getMusicTaskStatus = async (
  taskId: string,
  model: string
): Promise<MusicAPITaskStatusResponse> => {
  // *** ADD ENTRY LOG ***
  console.log(`[getMusicTaskStatus ENTRY] Received taskId: ${taskId}, model: ${model}`);
  // *** END LOG ***

  if (!taskId) {
    throw new Error('Task ID is required to check status.');
  }
  if (!model || !['sonic', 'studio'].includes(model)) {
    console.error(`[getMusicTaskStatus] Validation failed for model: ${model}`); // Log before throwing
    throw new Error('Valid model ("sonic" or "studio") is required to check status.');
  }

  let endpoint = '';

  // Determine the correct status endpoint based on the model
  if (model === 'sonic') {
    // Path based on documentation: /api/v1/sonic/task/{task_id}
    endpoint = `/api/v1/sonic/task/${encodeURIComponent(taskId)}`;
  } else { // model === 'studio'
    // ASSUMPTION: Studio might follow a similar pattern. VERIFY THIS PATH.
    // Using the path from Studio docs: /get-studio-music?task_id=...
    // If that doc is also wrong, maybe it's /api/v1/studio/task/{taskId} ? Needs verification.
    // endpoint = `/api/v1/studio/task/${encodeURIComponent(taskId)}`; // Hypothetical
    endpoint = `/get-studio-music?task_id=${encodeURIComponent(taskId)}`; // Keep based on previous doc link
  }

  console.log(`[getMusicTaskStatus] Using endpoint: ${endpoint} for model: ${model}, taskId: ${taskId}`);

  // Call the internal helper with GET method (no body), using the determined endpoint
  const responseData = await fetchMusicAPI<MusicAPITaskStatusResponse>(endpoint, 'GET');

  // Optional: Add validation for the status response structure if needed
  if (!responseData || typeof responseData.status !== 'string') {
    console.warn('[getMusicTaskStatus] Received status response with missing or invalid status field:', responseData);
    // Allow potentially incomplete data through, but log warning
  }

  return responseData;
};

/**
 * Uploads music to the Sonic API via a public URL.
 * @param musicUrl The public URL of the audio file (e.g., S3 URL).
 * @returns The response containing the clip_id.
 */
export const uploadMusicToSonic = async (
  musicUrl: string
): Promise<MusicAPIUploadResponse> => {
  console.log(`[uploadMusicToSonic ENTRY] Received musicUrl: ${musicUrl}`);

  if (!musicUrl) {
    throw new Error('Music URL is required for upload.');
  }

  const endpoint = '/api/v1/sonic/upload';
  const body = {
    url: musicUrl,
  };

  console.log(`[uploadMusicToSonic] Using endpoint: ${endpoint}`);

  // Call the internal helper with POST method
  const responseData = await fetchMusicAPI<MusicAPIUploadResponse>(endpoint, 'POST', body);

  // Basic validation for clip_id presence
  if (!responseData || typeof responseData.clip_id !== 'string' || !responseData.clip_id) {
    console.error('[uploadMusicToSonic] Invalid response structure received (missing or invalid clip_id):', responseData);
    throw new Error('MusicAPI upload response did not include a valid clip_id.');
  }

  return responseData;
};