import { Button, Input, Select, Space, Switch, Typography, message } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { Flexbox } from 'react-layout-kit';
import { Icon } from '@lobehub/ui';
import { Music2 } from 'lucide-react';
import SoundList from './SoundList';
import { SoundItemData } from './SoundItem';
import Paragraph from 'antd/es/typography/Paragraph';
import Title from 'antd/es/typography/Title';
import { MusicAPITaskStatusResponse, MusicAPIAudioResult } from '@/types/musicapi';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Constants for polling
const POLLING_INTERVAL = 5000;
const MAX_POLLING_ATTEMPTS = 48;

// Define props expected from the parent page
interface GenerationPanelProps {
  currentPlayingId: string | null;
  likedSounds: Record<string, boolean>;
  onPlayPause: (id: string, audioSrc: string) => void;
  onLikeToggle: (id: string) => void;
  songDescription: string;
  isCustomMode: boolean;
  onSongDescriptionChange: (value: string) => void;
  onIsCustomModeChange: (value: boolean) => void;
  styleValue: string;
  onStyleChange: (value: string) => void;
  lyricsValue: string;
  onLyricsChange: (value: string) => void;
}

// Interface for the expected structure from musicapi.ai's get-music endpoint
// *** IMPORTANT: Adapt this interface based on actual API response! ***
interface MusicApiTaskStatus {
  task_id: string;
  status: 'processing' | 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'error' | string; // Add all possible statuses
  // Example result structure (Adapt!) - often nested
  result?: {
    audios?: {
        id?: string; // May not be the same as task_id
        title?: string;
        download_url?: string; // Check actual field name
        image_url?: string;    // Check actual field name
        duration?: number;
        tags?: string | string[]; // Check actual field name and type
        // Add other relevant fields
    }[];
    // Or maybe the result is directly an object or array of objects?
    // e.g., result: { id: '...', title: '...', download_url: '...' }
    // Or result: [ { id: '...', ... }, { ... } ]
  };
  detail?: string; // For error messages
  // Add other top-level fields if they exist
}

// Helper function/component for styling input groups
const InputGroup: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <Flexbox gap={8} style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
    <Flexbox horizontal justify="space-between" align="center">
      <Text strong style={{color: 'white'}}>{title}</Text>
      {action}
    </Flexbox>
    {children}
  </Flexbox>
);

const GenerationPanel: React.FC<GenerationPanelProps> = ({
  currentPlayingId,
  likedSounds,
  onPlayPause,
  onLikeToggle,
  songDescription,
  isCustomMode,
  onSongDescriptionChange,
  onIsCustomModeChange,
  styleValue,
  onStyleChange,
  lyricsValue,
  onLyricsChange,
}) => {
  const [userSounds, setUserSounds] = useState<SoundItemData[]>([]);
  const [isInstrumental, setIsInstrumental] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('sonic');
  const [title, setTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef<number>(0);

  const handleDeleteSound = (id: string) => {
    console.log('Delete sound clicked:', id);
    setUserSounds(prevSounds => {
      const soundToDelete = prevSounds.find(s => s.id === id);
      const newSounds = prevSounds.filter(sound => sound.id !== id);
      if (soundToDelete) {
          message.success(`'${soundToDelete.title || 'Sound'}' deleted from your gallery.`);
      } else {
          message.info('Sound deleted from your gallery.');
      }
      if (currentPlayingId === id) {
         // We don't control the audio element directly anymore
         // The parent's audio handler should react to currentPlayingId becoming null
         // Maybe call onPlayPause with null? Or parent needs logic for this.
         // For now, rely on parent state change.
         // Alternative: Call a specific stop function from parent if provided.
      }
      return newSounds;
    });
  };

  const handleSoundGenerated = (newSound: SoundItemData) => {
    console.log('Adding new sound to user gallery:', newSound);
    setUserSounds(prevSounds => [newSound, ...prevSounds]);
  };

  const pollTaskStatus = async (taskId: string, modelUsed: string, msgKey: string) => {
    if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
      console.warn(`Polling stopped for task ${taskId} after ${MAX_POLLING_ATTEMPTS} attempts.`);
      message.warning({ content: `Task ${taskId} is taking longer than expected. Check back later.`, key: msgKey, duration: 5 });
      setIsLoading(false);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
      return;
    }

    pollingAttemptsRef.current += 1;
    console.log(`Polling attempt ${pollingAttemptsRef.current} for task ${taskId} (model: ${modelUsed})`);

    try {
      const response = await fetch(`/api/music/status?task_id=${taskId}&model=${modelUsed}`);

      if (!response.ok) {
        console.error(`Polling error: Backend /api/music/status returned status ${response.status}`, response);
        const errorMessage = `Error checking task status: ${response.statusText || 'Unknown error'}`;
        message.error({ content: errorMessage, key: msgKey, duration: 5 });
        setIsLoading(false);
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
        return;
      }

      console.log(`Polling response data for task ${taskId}:`, response);
      const taskData: any = await response.json();

      // Determine the actual task status
      // It might be in taskData.status or deduced from taskData.data[0].state
      let currentStatus = taskData.status?.toLowerCase();
      // If top-level status isn't definitive, check the state within the data array (if available)
      if (!currentStatus && taskData.data && taskData.data.length > 0 && taskData.data[0].state) {
        currentStatus = taskData.data[0].state.toLowerCase(); 
      }

      // Define status categories based on observed states (pending, running, succeeded, failed)
      const processingStatuses = ['processing', 'pending', 'running', 'queued']; // Add all intermediary states
      const successStatus = 'succeeded'; // Use 'succeeded' as per docs example
      const failureStatuses = ['failed', 'error'];

      if (!currentStatus) {
        // If status is still unknown, treat as processing but log a warning
        console.warn(`Task ${taskId} status could not be determined from response. Treating as processing. Data:`, taskData);
        message.info({ content: `Task ${taskId} status is currently unclear. Continuing to check...`, key: msgKey, duration: 3 });
        pollingTimeoutRef.current = setTimeout(() => pollTaskStatus(taskId, modelUsed, msgKey), POLLING_INTERVAL);
      } else if (processingStatuses.includes(currentStatus)) {
        console.log(`Task ${taskId} still processing (MusicAPI status: ${currentStatus})...`);
        pollingTimeoutRef.current = setTimeout(() => pollTaskStatus(taskId, modelUsed, msgKey), POLLING_INTERVAL);
      } else if (currentStatus === successStatus) {
        console.log(`Task ${taskId} finished processing (MusicAPI status: ${currentStatus}).`);

        // *** PARSE RESULTS FROM taskData.data ***
        let resultsToProcess: MusicAPIAudioResult[] = [];
        if (taskData.data && Array.isArray(taskData.data)) {
            resultsToProcess = taskData.data;
        } else {
            console.warn(`Task ${taskId} has success status but data format is unexpected:`, taskData);
        }

        if (resultsToProcess.length > 0) {
             const completedSounds: SoundItemData[] = resultsToProcess
                 .map((r: MusicAPIAudioResult): SoundItemData | null => {
                     const audioUrl = r.audio_url;
                     if (!audioUrl) return null;

                     const id = r.clip_id || taskId + '_' + Date.now() + '_' + Math.random();
                     
                     return {
                         id: id.toString(),
                         title: r.title || 'Generated Sound',
                         audioUrl: audioUrl,
                         imageUrl: r.image_url || undefined,
                         duration: r.duration,
                         tags: r.tags ? (typeof r.tags === 'string' ? r.tags.split(',').map((t: string) => t.trim()) : r.tags) : [],
                         isLiked: false,
                     };
                 })
                 .filter((s): s is SoundItemData => s !== null);

              if (completedSounds.length > 0) {
                  message.success({ content: `Generation complete! ${completedSounds.length} sound(s) added.`, key: msgKey, duration: 5 });
                  completedSounds.forEach(async (sound) => {
                    // Add to local UI state immediately
                    handleSoundGenerated(sound);
                    
                    // Then, attempt to save to backend/S3 (fire and forget for now)
                    try {
                      console.log(`[pollTaskStatus] Attempting to save sound ${sound.id} (${sound.title}) to backend...`);
                      const saveResponse = await fetch('/api/music/save-audio', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          audioUrl: sound.audioUrl,
                          title: sound.title,
                          duration: sound.duration,
                          tags: sound.tags,
                          apiClipId: sound.id, // Pass the original API clip_id (stored in our sound.id)
                          // Add other relevant metadata if needed by backend
                        }),
                      });
                      
                      if (!saveResponse.ok) {
                        const errorData = await saveResponse.json().catch(() => ({})); // Try to parse error
                        console.error(`[pollTaskStatus] Failed to save sound ${sound.id} to backend. Status: ${saveResponse.status}`, errorData);
                        // Optionally show a non-blocking warning to user
                        // message.warning(`Failed to save '${sound.title}' permanently.`); 
                      } else {
                        const successData = await saveResponse.json();
                        console.log(`[pollTaskStatus] Successfully saved sound ${sound.id} to backend. DB ID: ${successData.fileId}`);
                        // Optionally update the sound item in userSounds state with the DB ID or a 'saved' flag
                      }
                    } catch (error) {
                      console.error(`[pollTaskStatus] Error calling /api/music/save-audio for sound ${sound.id}:`, error);
                    }
                  });
              } else {
                   message.warning({ content: `Task ${taskId} completed, but no valid audio data found in response.`, key: msgKey, duration: 5 });
              }
        } else {
             console.error(`Polling error: SUCCESS status but no data array found. Data:`, taskData);
             message.error({ content: `Task completed but failed to parse results.`, key: msgKey, duration: 5 });
        }
        // *** END PARSING ***
        setIsLoading(false);
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;

      } else if (failureStatuses.includes(currentStatus)) {
        console.error(`Task ${taskId} failed (MusicAPI status: ${currentStatus}). Data:`, taskData);
        message.error({ content: `Generation failed: ${taskData.detail || currentStatus || 'Unknown error'}`, key: msgKey, duration: 8 });
        setIsLoading(false);
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      } else {
        console.warn(`Task ${taskId} has unknown MusicAPI status: ${currentStatus}. Treating as processing for now.`);
        message.info({ content: `Task ${taskId} has an unknown status: ${currentStatus}. Continuing to check...`, key: msgKey, duration: 3 });
        pollingTimeoutRef.current = setTimeout(() => pollTaskStatus(taskId, modelUsed, msgKey), POLLING_INTERVAL);
      }

    } catch (error) {
      console.error(`Polling fetch/parse error for task ${taskId}:`, error);
      message.error({ content: 'Network or parsing error during status check. Check console.', key: msgKey, duration: 5 });
      setIsLoading(false);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  const handleGenerate = async () => {
    let validationError = '';
    if (isCustomMode) {
        if (!styleValue.trim()) validationError = 'Please enter Style.';
        if (!title.trim()) validationError = 'Please enter Title.';
        if (!isInstrumental && !lyricsValue.trim()) {
            validationError = 'Please enter Lyrics (required when not instrumental).';
        }
    } else {
        if (!songDescription.trim()) validationError = 'Please enter Song Description.';
    }

    if (validationError) {
      message.warning(validationError);
      return;
    }

    setIsLoading(true);
    const generationMessageKey = 'generation-start' + Date.now();
    message.loading({ content: 'Starting audio generation...', key: generationMessageKey });

    // Construct the body sent to OUR backend (/api/music/generate)
    const requestBody: Record<string, any> = {
      customMode: isCustomMode,
      instrumental: isInstrumental,
      model: selectedModel,
      // Include fields needed by the backend based on mode
      ...(isCustomMode
        ? { title: title, style: styleValue, lyrics: lyricsValue }
        : { songDescription: songDescription }),
      // Add other fields if needed, like mv or negative_tags if controlled by frontend
      // mv: 'sonic-v3-5' // Example if frontend were to specify it
    };

    // Clean up empty/null values potentially sent
    Object.keys(requestBody).forEach(key => {
        if (requestBody[key] === null || requestBody[key] === undefined || requestBody[key] === '') {
            // Keep boolean flags even if false, remove others
            if (typeof requestBody[key] !== 'boolean') {
                 delete requestBody[key];
            }
        }
    });

    console.log('Sending generation request to /api/music/generate:', requestBody);

    // *** ADD LOG BEFORE FETCH ***
    console.log('[handleGenerate] Final requestBody being stringified:', requestBody);
    // *** END LOG ***

    try {
      const response = await fetch('/api/music/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || data.code !== 200) {
        console.error('Generation API error from /api/music/generate:', data);
        message.error({ content: `Generation failed: ${data.error || data.message || 'Unknown error'}`, key: generationMessageKey, duration: 5 });
        setIsLoading(false);
      } else {
        const taskId = data?.data?.task_id;
        if (taskId) {
          console.log(`Generation started with task_id: ${taskId}`);
          message.success({ content: `Generation task started (ID: ${taskId}). Checking status...`, key: generationMessageKey, duration: 3 });
          pollingAttemptsRef.current = 0;
          const initialPollDelay = 2000;
          setTimeout(() => {
             console.log(`Starting polling for ${taskId} after ${initialPollDelay}ms delay.`);
             pollTaskStatus(taskId, selectedModel, generationMessageKey);
          }, initialPollDelay);
        } else {
           console.error('No task_id received from /api/music/generate:', data);
           message.error({ content: 'Generation started but failed to get task ID.', key: generationMessageKey, duration: 5 });
           setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch /api/music/generate:', error);
      message.error({ content: 'Failed to start generation. Check console for details.', key: generationMessageKey, duration: 5 });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedSounds = localStorage.getItem('userGeneratedSounds');
    if (storedSounds) {
      try {
        const parsedSounds = JSON.parse(storedSounds);
        if (Array.isArray(parsedSounds)) {
          setUserSounds(parsedSounds);
        }
      } catch (e) {
        console.error("Failed to parse user sounds from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('userGeneratedSounds', JSON.stringify(userSounds));
  }, [userSounds]);

  useEffect(() => {
     return () => {
       if (pollingTimeoutRef.current) {
         clearTimeout(pollingTimeoutRef.current);
         console.log('Cleared polling timeout on unmount.');
       }
     };
   }, []);

  return (
    <Flexbox gap={16} style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      <Title level={4} style={{ margin: 0 }}>AI Music Generation</Title>

      <Flexbox horizontal justify="space-between" align="center">
         <Space>
           <Switch size="small" checked={isCustomMode} onChange={onIsCustomModeChange} disabled={isLoading} />
           <Text style={{ color: isCustomMode ? 'white' : 'grey' }}>Custom Mode</Text>
         </Space>
         <Select
           size="small"
           value={selectedModel}
           onChange={setSelectedModel}
           disabled={isLoading}
           style={{ width: 100, background: 'rgba(0,0,0,0.2)', border: 'none' }}
         >
           <Option value="sonic">Sonic</Option>
           <Option value="studio">Studio</Option>
         </Select>
      </Flexbox>

      {!isCustomMode ? (
        <InputGroup title="Song Description">
          <Paragraph type="secondary" style={{ margin: '0 0 8px 0', fontSize: 12 }}>
            Describe the style of music and the topic you want.
          </Paragraph>
          <TextArea
            rows={6}
            placeholder="Enter song description..."
            value={songDescription}
            onChange={(e) => onSongDescriptionChange(e.target.value)}
            disabled={isLoading}
            maxLength={400}
            showCount
          />
        </InputGroup>
      ) : (
        <Flexbox gap={16}>
          <InputGroup title="Title">
            <Input
               placeholder="Enter a title"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               disabled={isLoading}
               maxLength={80}
            />
          </InputGroup>

          <InputGroup title="Style of Music">
             <Input
               placeholder="Enter style of music"
               value={styleValue}
               onChange={(e) => onStyleChange(e.target.value)}
               disabled={isLoading}
               maxLength={120}
             />
             <div style={{ textAlign: 'right', fontSize: 12, color: 'grey' }}>
               {styleValue.length}/120
             </div>
          </InputGroup>

          <InputGroup
             title="Lyrics"
             action={
                <Space>
                  <Text style={{ color: isInstrumental ? 'white' : 'grey' }}>Instrumental</Text>
                  <Switch size="small" checked={isInstrumental} onChange={setIsInstrumental} disabled={isLoading} />
                </Space>
             }
           >
             <Paragraph type="secondary" style={{ margin: '0 0 8px 0', fontSize: 12 }}>
               Write your own lyrics.
             </Paragraph>
            <TextArea
              rows={6}
              placeholder="Enter lyrics... (Required unless Instrumental is checked)"
              value={lyricsValue}
              onChange={(e) => onLyricsChange(e.target.value)}
              disabled={isLoading || isInstrumental}
              maxLength={2999}
              showCount
            />
          </InputGroup>
        </Flexbox>
      )}

      <Button
        type="primary"
        icon={<Icon icon={Music2} />}
        onClick={handleGenerate}
        loading={isLoading}
        block
        style={{ marginTop: 16, marginBottom: 24 }}
      >
        {isLoading ? 'Generating...' : 'Generate'}
      </Button>

      <Flexbox gap={16} style={{ marginTop: 24, width: '100%' }}>
        <Title level={5}>Your gallery</Title>
        <SoundList
          sounds={userSounds}
          currentPlayingId={currentPlayingId ?? undefined}
          onPlayPause={onPlayPause}
          onLikeToggle={onLikeToggle}
          likedSounds={likedSounds}
          listType="user"
          onDelete={handleDeleteSound}
        />
      </Flexbox>
    </Flexbox>
  );
};

export default GenerationPanel; 