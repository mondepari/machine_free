// src/types/musicapi.ts

export interface MusicAPIErrorResponse {
    code?: number | string;
    detail?: string;
    error?: string;
    message?: string; // Include code if the API might return it in errors
  }
  
  export interface MusicAPICreateTaskResponse {
    task_id: string;
    // Include other potential fields returned upon successful task creation
    // e.g., status?: string; estimated_completion_time?: number;
  }
  
  // Represents a single audio result within the status response
  export interface MusicAPIAudioResult {
    audio_url?: string;
    clip_id?: string;
    cover_image_url?: string;
    download_url?: string;
    // Alternative field name
    duration?: number; 
    id?: string; // Another alternative
    image_url?: string;
    tags?: string | string[]; 
    title?: string;
    // Alternative field name
    url?: string;
    // Add other relevant fields per audio track
  }
  
  export interface MusicAPITaskStatusResponse {
    // Task ID might not be in the status response itself, but useful for context
    code?: number; 
    // Overall status (e.g., "completed", "processing", "failed") - May need parsing from `data` array below
// The main result seems to be in a 'data' array
    data?: MusicAPIAudioResult[]; 
    // Add detail for potential top-level error messages
    detail?: string; 
    // Response code (e.g., 200)
    message?: string; 
    // e.g., "success"
    status?: string; 
    task_id?: string; 
    // Keep the old 'result' field commented out for reference, but prioritize 'data'
    // result?: {
    //   audios?: MusicAPIAudioResult[];
    // } | MusicAPIAudioResult[] | MusicAPIAudioResult;
  }

  // Response for the /api/v1/sonic/upload endpoint
  export interface MusicAPIUploadResponse {
    clip_id?: string;
    code?: number; 
    detail?: string;
    // The important ID returned by the API
    message?: string; // Include detail for potential errors
  }