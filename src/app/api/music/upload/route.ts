import { getUserAuth } from '@/utils/server/auth';
import { ServerService } from '@/services/file/server';
import { UserModel } from '@/database/models/user';
import { serverDB } from '@/database/server';
import { uploadMusicToSonic } from '@/libs/musicapi';
import { NextResponse } from 'next/server';

// export const runtime = 'edge'; // May need to be nodejs due to dependencies

// Instantiate the service (assuming it doesn't need userId in constructor)
const fileService = new ServerService();

export async function POST(req: Request) {
  console.log('[API Route][Upload Music] Received request');

  // 1. Authentication
  let userId: string | undefined | null;
  try {
    const { userId: authUserId } = await getUserAuth();
    userId = authUserId;
  } catch (error) {
    console.error('[API Route][Upload Music] Auth error:', error);
    // Handle cases where auth is not enabled or fails
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  if (!userId) {
    console.error('[API Route][Upload Music] Unauthorized: No user ID found after auth check');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. UserModel Instantiation and Storage Check (Check is commented out)
  try {
    // Instantiate UserModel with serverDB and userId
    const userModel = new UserModel(serverDB, userId);
    
    // TODO: Find the correct method in UserModel to check upload allowance/storage limit.
    // The 'isAllowUpload' method does not exist on UserModel.
    // const isUserAllowUpload = await userModel.isAllowUpload(); 
    // if (!isUserAllowUpload) {
    //   return NextResponse.json({ error: 'User storage is full' }, { status: 403 });
    // }
    console.log(`[API Route][Upload Music] Instantiated UserModel for user ${userId}. Storage check is currently disabled.`);

  } catch (e) {
    console.error('[API Route][Upload Music] Error instantiating UserModel. Cannot proceed.', e);
    // It's probably unsafe to continue if UserModel can't be instantiated
    return NextResponse.json({ error: 'Could not verify user status' }, { status: 500 }); 
  }

  // 3. Parse Payload
  let payload;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { fileId } = payload;
  if (!fileId || typeof fileId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid fileId' }, { status: 400 });
  }

  console.log(`[API Route][Upload Music] Request for fileId: ${fileId} by userId: ${userId}`);

  try {
    // 4. Get File URL from Database
    console.log(`[API Route][Upload Music] Fetching file metadata from DB for fileId: ${fileId}`);
    const file = await fileService.getFile(fileId);

    if (!file || !file.url) {
      console.error(`[API Route][Upload Music] File not found or URL missing for fileId: ${fileId}, userId: ${userId}`);
      return NextResponse.json({ error: 'File not found or invalid' }, { status: 404 });
    }

    // Re-verify ownership based on DB schema
    if ((file as any).userId !== userId) { 
       console.error(`[API Route][Upload Music] User ${userId} attempted to upload file ${fileId} owned by ${(file as any).userId}`);
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Add checks for music file type and duration from file metadata if available
    // const metadata = (file as any).metadata;

    const musicUrl = file.url;
    console.log(`[API Route][Upload Music] Found S3 URL: ${musicUrl}`);

    // 5. Call MusicAPI Upload Service
    console.log(`[API Route][Upload Music] Calling uploadMusicToSonic with URL: ${musicUrl}`);
    const uploadResponse = await uploadMusicToSonic(musicUrl);
    console.log(`[API Route][Upload Music] MusicAPI Upload Response:`, uploadResponse);

    // 6. Save the received clip_id to file metadata
    if (uploadResponse.clip_id) {
      console.log(`[API Route][Upload Music] Received clip_id: ${uploadResponse.clip_id}. Attempting to update metadata...`);
      try {
         // Import lambdaClient if not already imported
         const { lambdaClient } = await import('@/libs/trpc/client'); 

         const currentMetadata = (file as any).metadata || {};
         const newMetadata = {
            ...currentMetadata,
            sonicClipId: uploadResponse.clip_id // Add the new clip ID
         };

         // Call the new tRPC mutation
         await lambdaClient.file.updateFileMetadata.mutate({ 
           id: fileId, 
           metadata: newMetadata
         });
         console.log(`[API Route][Upload Music] Successfully updated file metadata with clip_id.`);
      } catch (dbError) {
        console.error(`[API Route][Upload Music] Failed to update file metadata for ${fileId} after successful API upload:`, dbError);
         // Proceed without failing the whole request, but log the error
      }
    }

    // 7. Return Success Response
    return NextResponse.json({
      message: 'Music uploaded to Sonic API successfully',
      data: uploadResponse,
    });

  } catch (error: any) {
    console.error('[API Route][Upload Music] Error processing request:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload music' }, { status: 500 });
  }
} 