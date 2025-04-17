import { NextRequest, NextResponse } from 'next/server';
import { getMusicTaskStatus } from '../../../../libs/musicapi';

// Base URL and API key are now handled within musicapi.ts

export async function GET(request: NextRequest) {

  // API Key check is now done within the musicapi service
  // const sunoApiKey = process.env.SUNO_API_KEY;
  // ... (removed API key check)

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('task_id');
  const model = searchParams.get('model');

  // Initial validation (also ensures they are not null)
  if (!taskId) {
    console.error('[API Route][Status] Status request missing task_id query parameter');
    return NextResponse.json({ code: 400, error: 'Missing task_id query parameter' }, { status: 400 });
  }
  if (!model || !['sonic', 'studio'].includes(model)) {
    console.error(`[API Route][Status] Status request missing or invalid model query parameter: ${model}`);
    return NextResponse.json({ code: 400, error: 'Missing or invalid model query parameter (must be "sonic" or "studio")' }, { status: 400 });
  }

  // At this point, taskId and model are guaranteed to be non-null strings
  console.log(`[API Route][Status] Received status request for task_id: ${taskId}, model: ${model}`);

  try {
    // *** ADD LOG BEFORE CALL ***
    console.log(`[API Route][Status] Calling getMusicTaskStatus with taskId type: ${typeof taskId}, value: ${taskId}`);
    console.log(`[API Route][Status] Calling getMusicTaskStatus with model type: ${typeof model}, value: ${model}`);
    // *** END LOG ***
    // Pass the guaranteed non-null string values
    const statusData = await getMusicTaskStatus(taskId, model);
    console.log(`[API Route][Status] MusicAPI status response for task ${taskId} (model: ${model}):`, statusData);
    return NextResponse.json(statusData);

  } catch (error: any) {
    console.error(`[API Route] Error checking status for task ${taskId}:`, error.message);
    // Forward the specific error message from the service
    return NextResponse.json({ error: error.message || `Failed to check status for task ${taskId}` }, { status: 500 });
  }
} 