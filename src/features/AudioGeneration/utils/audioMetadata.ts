export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  duration?: number;
  cover?: string;
}

export const extractAudioMetadata = async (audioUrl: string): Promise<AudioMetadata> => {
  try {
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    
    // Create a temporary audio element to get duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      audio.addEventListener('loadedmetadata', () => {
        const metadata: AudioMetadata = {
          duration: audio.duration,
        };
        
        // Try to extract ID3 tags if available
        if (blob.type === 'audio/mpeg') {
          const reader = new FileReader();
          reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const dataView = new DataView(arrayBuffer);
            
            // Check for ID3 tag
            if (dataView.getUint32(0) === 0x49443300) { // "ID3"
              // Basic ID3v2 parsing
              const id3Size = dataView.getUint32(6);
              const id3Data = new Uint8Array(arrayBuffer, 10, id3Size);
              
              // Look for title frame (TIT2)
              const titleIndex = id3Data.indexOf(0x54, 0); // 'T'
              if (titleIndex !== -1 && id3Data[titleIndex + 1] === 0x49 && id3Data[titleIndex + 2] === 0x54 && id3Data[titleIndex + 3] === 0x32) {
                const titleLength = id3Data[titleIndex + 4];
                metadata.title = String.fromCharCode.apply(null, Array.from(id3Data.slice(titleIndex + 5, titleIndex + 5 + titleLength)));
              }
              
              // Look for artist frame (TPE1)
              const artistIndex = id3Data.indexOf(0x54, 0); // 'T'
              if (artistIndex !== -1 && id3Data[artistIndex + 1] === 0x50 && id3Data[artistIndex + 2] === 0x45 && id3Data[artistIndex + 3] === 0x31) {
                const artistLength = id3Data[artistIndex + 4];
                metadata.artist = String.fromCharCode.apply(null, Array.from(id3Data.slice(artistIndex + 5, artistIndex + 5 + artistLength)));
              }
              
              // Look for album frame (TALB)
              const albumIndex = id3Data.indexOf(0x54, 0); // 'T'
              if (albumIndex !== -1 && id3Data[albumIndex + 1] === 0x41 && id3Data[albumIndex + 2] === 0x4C && id3Data[albumIndex + 3] === 0x42) {
                const albumLength = id3Data[albumIndex + 4];
                metadata.album = String.fromCharCode.apply(null, Array.from(id3Data.slice(albumIndex + 5, albumIndex + 5 + albumLength)));
              }
              
              // Look for attached picture frame (APIC)
              const picIndex = id3Data.findIndex((byte, i) => 
                 i + 3 < id3Data.length &&
                 byte === 0x41 && // 'A'
                 id3Data[i + 1] === 0x50 && // 'P'
                 id3Data[i + 2] === 0x49 && // 'I'
                 id3Data[i + 3] === 0x43    // 'C'
              );
              
              if (picIndex !== -1) {
                console.log(`[metadata] APIC frame found at index ${picIndex}`);
                // Read frame size (assuming ID3v2.3/4 format where size is 4 bytes sync-safe integer)
                const picSize = 
                  (id3Data[picIndex + 4] << 21) |
                  (id3Data[picIndex + 5] << 14) |
                  (id3Data[picIndex + 6] << 7) |
                  id3Data[picIndex + 7];
                console.log(`[metadata] APIC frame size: ${picSize}`);
                  
                const frameHeaderSize = 10; // Frame ID (4) + Size (4) + Flags (2)
                const picDataStart = picIndex + frameHeaderSize;
                 
                if (picDataStart + picSize <= id3Data.length) {
                  const frameData = id3Data.slice(picDataStart, picDataStart + picSize);
                  
                  // Find mime type (null-terminated string after encoding byte)
                  const encodingByte = frameData[0]; // Skip encoding byte
                  let mimeTypeEnd = 1;
                  while (mimeTypeEnd < frameData.length && frameData[mimeTypeEnd] !== 0x00) {
                      mimeTypeEnd++;
                  }
                   
                  if (mimeTypeEnd < frameData.length) {
                    const mimeTypeBytes = frameData.slice(1, mimeTypeEnd);
                    const mimeType = String.fromCharCode.apply(null, Array.from(mimeTypeBytes));
                    console.log(`[metadata] Cover MIME type: ${mimeType}`);
                    
                    // Picture type byte is after mime type null terminator
                    const pictureType = frameData[mimeTypeEnd + 1];
                    console.log(`[metadata] Picture Type: ${pictureType}`);

                    // Find description (null-terminated string after picture type)
                    let descriptionEnd = mimeTypeEnd + 2;
                    // Handle different string encodings if needed based on encodingByte
                    while (descriptionEnd < frameData.length && frameData[descriptionEnd] !== 0x00) {
                        // Potential TODO: Handle UTF-16 (if encodingByte is 1 or 2) with 2-byte null terminators
                        descriptionEnd++;
                    }
                    
                    const imageDataStart = descriptionEnd + 1; // Image data starts after description null terminator
                    
                    if (imageDataStart < frameData.length) {
                       const imageData = frameData.slice(imageDataStart);
                       console.log(`[metadata] Image data length: ${imageData.length}`);
                       
                       try {
                          const blob = new Blob([imageData], { type: mimeType });
                          metadata.cover = URL.createObjectURL(blob);
                          console.log(`[metadata] Created blob URL for cover: ${metadata.cover}`);
                       } catch (blobError) {
                          console.error("[metadata] Error creating Blob or Object URL:", blobError);
                       }
                    } else {
                       console.log("[metadata] No image data found after description.");
                    }
                  } else {
                      console.log("[metadata] Could not find MIME type null terminator.");
                  }
                } else {
                    console.log("[metadata] APIC frame size exceeds available data.")
                }
              } else {
                 console.log("[metadata] APIC frame not found.");
              }
            }
            
            resolve(metadata);
          };
          reader.readAsArrayBuffer(blob);
        } else {
          resolve(metadata);
        }
      });
      
      audio.addEventListener('error', () => {
        resolve({});
      });
    });
  } catch (error) {
    console.error('Error extracting audio metadata:', error);
    return {};
  }
}; 