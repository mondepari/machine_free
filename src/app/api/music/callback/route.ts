import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles POST requests from the MusicAPI.ai callbacks.
 */
export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();
    // Log for debugging, can be removed or reduced later
    console.log('Received MusicAPI.ai Callback:', JSON.stringify(callbackData, null, 2));

    // TODO: Optionally process callback data here
    // (e.g., update task status in DB, send notifications).
    // For now, just acknowledge receipt, relying on polling.

    // API expects a 200 OK response to acknowledge receipt
    return NextResponse.json({ message: 'Callback received successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error processing MusicAPI.ai callback:', error);
    // Return error, but status 200 so the API doesn't retry
    return NextResponse.json({ error: 'Failed to process callback' }, { status: 200 });
  }
}

// Optional: Handle GET requests if needed (most APIs use POST for callbacks)
export async function GET(request: NextRequest) {
    console.log('Received GET request on callback URL.');
    return NextResponse.json({ message: 'Callback endpoint is active. Use POST for callbacks.' }, { status: 200 });
}