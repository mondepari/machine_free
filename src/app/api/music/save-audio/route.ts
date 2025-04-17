import { auth } from '@/auth'; // Assuming this is the correct NextAuth helper
import { FILE_CHUNK_SIZE, UploadFileParams, uploadFile } from '@/server/files/upload'; // ASSUMING uploadFile utility exists here
import { fileService } from '@/server/services/file'; // ASSUMING fileService handles DB operations
import { UserDAL } from '@/server/db/UserDAL'; // Needed for user storage check
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Determine runtime based on dependencies (uploadFile/fileService might require nodejs)
// export const runtime = 'edge'; // Comment out edge if nodejs is needed

export async function POST(req: Request) {
  console.log('[API Route][Save Audio] Received request');

  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    console.error('[API Route][Save Audio] Unauthorized: No user session found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // 2. Check User Storage
  const userDAL = new UserDAL(userId);
  const isUserAllowUpload = await userDAL.isAllowUpload();
  if (!isUserAllowUpload) {
    return NextResponse.json({ error: 'User storage is full' }, { status: 403 });
  }

  // 3. Parse Payload
  let payload;
  try {
    payload = await req.json();
    console.log('[API Route][Save Audio] Parsed payload:', payload);
  } catch (error) {
    console.error('[API Route][Save Audio] Failed to parse request body:', error);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    audioUrl, // External URL from musicapi.ai
    title,
    duration,
    tags,
    apiClipId // Original clip_id from musicapi.ai
  } = payload;

  // --- Basic Validation ---
  if (!audioUrl || typeof audioUrl !== 'string' || !title || typeof title !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid audioUrl or title' }, { status: 400 });
  }

  try {
    // 4. Fetch the audio from the external URL
    console.log(`[API Route][Save Audio] Fetching audio from: ${audioUrl}`);
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok || !audioResponse.body) {
      throw new Error(`Failed to fetch audio stream from external URL: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
    const totalSize = Number(audioResponse.headers.get('content-length') || 0); // Get total size if available
    console.log(`[API Route][Save Audio] Fetched audio stream. Content-Type: ${contentType}, Total Size: ${totalSize}`);

    // Check storage again with actual size
    if (totalSize > 0 && !(await userDAL.isAllowUpload(totalSize))) {
      return NextResponse.json({ error: `User storage limit exceeded. Required: ${totalSize}` }, { status: 413 }); // 413 Payload Too Large
    }
    
    // 5. Prepare file metadata and upload parameters
    const fileExtension = contentType.split('/')[1]?.split(';')[0] || 'mp3'; // Extract extension, handle potential charset
    const fileName = `${title}.${fileExtension}`;
    const fileId = uuidv4(); // Generate ID for the file record
    const s3Key = await fileService.getS3Key(userId, fileId); // Assuming fileService generates the key

    const uploadParams: UploadFileParams = {
      Body: audioResponse.body, // Stream the body directly
      ContentType: contentType,
      Key: s3Key,
      Metadata: { // Add custom metadata if supported/needed by your S3 setup
        'user-id': userId,
        'file-id': fileId,
      },
      // size: totalSize // Size might be needed depending on uploadFile implementation
    };

    console.log(`[API Route][Save Audio] Uploading to S3. Key: ${s3Key}`);
    
    // 6. Upload to S3 using LobeChat's utility
    const uploadResult = await uploadFile(uploadParams); // ASSUMING this handles streaming upload
    console.log('[API Route][Save Audio] S3 upload finished:', uploadResult);
    const finalSize = uploadResult.size ?? totalSize; // Use size from upload result if available

    // Check storage one last time after upload confirms size
    await userDAL.checkUserStorageOrThrow(finalSize);

    // 7. Save metadata to Database using LobeChat's service
    console.log('[API Route][Save Audio] Saving metadata to database...');
    const fileMetadata = {
        apiClipId: apiClipId,
        duration: duration,
        tags: tags,
        source: 'musicapi.ai',
        originalUrl: audioUrl,
    };

    const dbRecord = await fileService.createFile({
      id: fileId,
      userId: userId,
      name: fileName,
      size: finalSize,
      mimeType: contentType,
      url: uploadResult.url, // URL returned from uploadFile utility
      metadata: fileMetadata, // Store extra info (adjust field name if needed)
      // folderId: null, // Assign to a folder if needed
      // fileType: 'audio', // Set fileType if applicable
    });

    console.log('[API Route][Save Audio] Database record created:', dbRecord);

    // 8. Return Success Response
    return NextResponse.json({
        message: 'Audio saved successfully',
        file: dbRecord, // Return the created file record
    });

  } catch (error: any) {
    console.error('[API Route][Save Audio] Error processing request:', error);
    // Handle potential user storage errors explicitly
    if (error?.message?.includes('STORAGE_LIMIT_EXCEEDED')) {
      return NextResponse.json({ error: 'User storage limit exceeded' }, { status: 413 }); 
    }
    return NextResponse.json({ error: error.message || 'Failed to save audio' }, { status: 500 });
  }
} 