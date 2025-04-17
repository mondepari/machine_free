import { NextResponse } from 'next/server';
import { createMusicTask } from '../../../../libs/musicapi'; // Import the new service

// Base URL is now handled within musicapi.ts
// const MUSIC_API_ENDPOINT = '...';

export async function POST(req: Request) {
  let requestPayload;
  try {
    requestPayload = await req.json();
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return NextResponse.json({ code: 400, error: 'Invalid request body' }, { status: 400 });
  }

  console.log('Received generation request payload:', requestPayload);

  const {
    customMode,   // boolean
    instrumental, // boolean
    model,        // 'sonic' or 'studio'
    title,        // string (custom only)
    style,        // string (used as tags)
    lyrics,       // string (custom only, used as prompt)
    songDescription, // string (description mode only, used as gpt_description_prompt)
    mv // Optional: model version from frontend?
  } = requestPayload;

  // --- Validation ---
  if (typeof model !== 'string' || !['sonic', 'studio'].includes(model)) {
    return NextResponse.json({ code: 400, error: 'Invalid or missing model (must be sonic or studio)' }, { status: 400 });
  }
  if (typeof customMode !== 'boolean') {
    return NextResponse.json({ code: 400, error: 'Invalid or missing customMode flag' }, { status: 400 });
  }
  // ... add more validation as needed ...

  // --- Construct FLAT API Request Body ---
  let apiRequestBody: Record<string, any> = {
    model: model, // Include model in body as per Postman
    mv: mv || (model === 'sonic' ? 'sonic-v3-5' : undefined), // Default Sonic version, undefined for Studio unless specified
    custom_mode: customMode, // Use custom_mode field as seen in Postman
    make_instrumental: instrumental ?? false,
    // Add webhook if needed, directly in the body if API expects it flat
    // webhook_url: callbackUrl, // Example if needed flat
  };

  const taskType = customMode ? 'generate_music_custom' : 'generate_music';
  apiRequestBody.task_type = taskType; // Include task_type as per Postman body structure (though path might differentiate)

  if (customMode) {
    if (!title || !style || (!instrumental && !lyrics)) {
      return NextResponse.json({ code: 400, error: 'Missing fields for Custom Mode (title, style, lyrics/instrumental)' }, { status: 400 });
    }
    apiRequestBody.title = title;
    apiRequestBody.tags = style; // Use 'tags' field
    apiRequestBody.prompt = lyrics || ""; // Use 'prompt' field for lyrics
    apiRequestBody.negative_tags = requestPayload.negative_tags || ""; // Add if provided
  } else {
    if (!songDescription) {
      return NextResponse.json({ code: 400, error: 'Missing field for Description Mode (songDescription)' }, { status: 400 });
    }
    apiRequestBody.gpt_description_prompt = songDescription; // Use 'gpt_description_prompt'
    apiRequestBody.negative_tags = requestPayload.negative_tags || ""; // Add if provided
  }

  // Remove undefined mv to avoid sending `"mv": null`
  if (apiRequestBody.mv === undefined) {
    delete apiRequestBody.mv;
  }

  console.log('Constructed FLAT MusicAPI Request Body:', JSON.stringify(apiRequestBody, null, 2));

  try {
    console.log(`Calling createMusicTask with model: ${model}, taskType: ${taskType}`);
    // Pass the FLAT body, model, and taskType
    const responseData = await createMusicTask(apiRequestBody, model, taskType);

    console.log('MusicAPI create task response:', responseData);

    if (responseData && responseData.task_id) {
      return NextResponse.json({
        code: 200,
        message: 'Task created successfully',
        data: { task_id: responseData.task_id },
      });
    } else {
      console.error('MusicAPI response missing task_id:', responseData);
      return NextResponse.json({ code: 500, error: 'Failed to create task: Invalid response structure from MusicAPI' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error calling createMusicTask:', error);
    let errorMessage = 'Failed to create music task';
    try {
      // Error thrown from fetchMusicAPI should be an Error object with a message
      errorMessage = error.message || 'Unknown error during task creation';
    } catch (e) {
      errorMessage = 'Unknown error during task creation';
    }
    return NextResponse.json({ code: 500, error: errorMessage }, { status: 500 });
  }
} 