/* global HeadersInit, RequestInit */

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Get data from the frontend request
    const { prompt, model, videoApiKey, videoEndpoint } = await request.json();

    console.log('[API Proxy] Received request:', { endpoint: videoEndpoint, model, prompt });

    // 2. Validate necessary data
    if (!prompt || !model || !videoEndpoint) {
      return NextResponse.json({ error: 'Missing required fields: prompt, model, videoEndpoint' }, { status: 400 });
    }
    // API Key might be optional depending on the target endpoint, but add check if required
    if (videoEndpoint.includes('electronhub') && !videoApiKey) {
       return NextResponse.json({ error: 'Missing API Key for electronhub' }, { status: 400 });
    }

    // 3. Prepare the request to the external API
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (videoApiKey) {
      headers['Authorization'] = `Bearer ${videoApiKey}`;
    }

    const payload = {
      model: model,
      prompt: prompt,
    };

    console.log(`[API Proxy] Forwarding request to: ${videoEndpoint}`);
    console.log('[API Proxy] Forwarding payload:', payload);
    console.log('[API Proxy] Forwarding headers:', headers);

    // 4. Make the actual request from the server
    const response = await fetch(videoEndpoint, {
      body: JSON.stringify(payload),
      headers: headers,
      method: 'POST',
    });

    console.log('[API Proxy] External API response status:', response.status);

    // 5. Handle the external API's response
    const responseBody = await response.text(); // Get text first to handle potential non-JSON errors
    console.log('[API Proxy] External API response body:', responseBody);

    if (!response.ok) {
      // Try to parse as JSON, fallback to text
      let errorDetails = responseBody;
      try {
        errorDetails = JSON.parse(responseBody);
      } catch { /* Ignore parsing error */ }

      // Forward the error status and body from the external API
      return NextResponse.json({ details: errorDetails, error: 'External API Error' }, { status: response.status });
    }

    // If response is OK, assume it's JSON and forward it
    let successData;
    try {
      successData = JSON.parse(responseBody);
    } catch {
      // If parsing fails even on success, return an internal error
      return NextResponse.json({ error: 'Failed to parse successful external API response' }, { status: 500 });
    }

    return NextResponse.json(successData);

  } catch (error: any) {
    console.error('[API Proxy] Internal error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
} 