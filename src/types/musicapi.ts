// src/types/musicapi.ts

export interface MusicAPIErrorResponse {
    error?: string;
    message?: string;
    detail?: string;
    code?: number | string; // Include code if the API might return it in errors
  }
  
  export interface MusicAPICreateTaskResponse {
    task_id: string;
    // Include other potential fields returned upon successful task creation
    // e.g., status?: string; estimated_completion_time?: number;
  }
  
  // Represents a single audio result within the status response
  export interface MusicAPIAudioResult {
    clip_id?: string;
    id?: string;
    title?: string;
    download_url?: string;
    audio_url?: string; // Alternative field name
    url?: string; // Another alternative
    image_url?: string;
    cover_image_url?: string; // Alternative field name
    duration?: number;
    tags?: string | string[];
    // Add other relevant fields per audio track
  }
  
  export interface MusicAPITaskStatusResponse {
    task_id?: string; // Task ID might not be in the status response itself, but useful for context
    code?: number; // Response code (e.g., 200)
    message?: string; // e.g., "success"
    status?: string; // Overall status (e.g., "completed", "processing", "failed") - May need parsing from `data` array below
    // The main result seems to be in a 'data' array
    data?: MusicAPIAudioResult[]; 
    // Add detail for potential top-level error messages
    detail?: string; 
    // Keep the old 'result' field commented out for reference, but prioritize 'data'
    // result?: {
    //   audios?: MusicAPIAudioResult[];
    // } | MusicAPIAudioResult[] | MusicAPIAudioResult;
  }

  // Response for the /api/v1/sonic/upload endpoint
  export interface MusicAPIUploadResponse {
    code?: number;
    clip_id?: string; // The important ID returned by the API
    message?: string;
    detail?: string; // Include detail for potential errors
  }