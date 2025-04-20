import { Button, Input, Select, Space, Switch, Typography, message } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { Flexbox } from 'react-layout-kit';
import { Icon } from '@lobehub/ui';
import { Music2 } from 'lucide-react';
import SoundList from './SoundList';
import { SoundItemData } from './SoundItem';
import Paragraph from 'antd/es/typography/Paragraph';
import Title from 'antd/es/typography/Title';
import { MusicAPIAudioResult } from '@/types/musicapi';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Constants for polling
const POLLING_INTERVAL = 5000;
const MAX_POLLING_ATTEMPTS = 48;

// Define props expected from the parent page
interface GenerationPanelProps {
  currentPlayingId: string | null;
  isCustomMode: boolean;
  likedSounds: Record<string, boolean>;
  lyricsValue: string;
  onIsCustomModeChange: (value: boolean) => void;
  onLikeToggle: (id: string) => void;
  onLyricsChange: (value: string) => void;
  onPlayPause: (id: string, audioSrc: string) => void;
  onSongDescriptionChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  songDescription: string;
  styleValue: string;
}

// Interface for the expected structure from musicapi.ai's get-music endpoint
// *** IMPORTANT: Adapt this interface based on actual API response! ***
interface MusicApiTaskStatus {
  detail?: string;
  // Add all possible statuses
// Example result structure (Adapt!) - often nested
  result?: {
    audios?: {
        download_url?: string; 
        // Check actual field name
        duration?: number;
        id?: string; // Check actual field name
        image_url?: string;    
        tags?: string | string[];
        // May not be the same as task_id
        title?: string; // Check actual field name and type
        // Add other relevant fields
    }[];
    // Or maybe the result is directly an object or array of objects?
    // e.g., result: { id: '...', title: '...', download_url: '...' }
    // Or result: [ { id: '...', ... }, { ... } ]
  }; 
  status: 'processing' | 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'error' | string;
  task_id: string; // For error messages
  // Add other top-level fields if they exist
}

// Helper function/component for styling input groups
const InputGroup: React.FC<{ action?: React.ReactNode, children: React.ReactNode; title: string; }> = ({ title, children, action }) => (
  <Flexbox gap={8} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '12px 16px' }}>
    <Flexbox align="center" horizontal justify="space-between">
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
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      message.warning({ content: `Task ${taskId} is taking longer than expected. Check back later.`, duration: 5, key: msgKey });
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
        message.error({ content: errorMessage, duration: 5, key: msgKey });
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
        message.info({ content: `Task ${taskId} status is currently unclear. Continuing to check...`, duration: 3, key: msgKey });
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
                         audioUrl: audioUrl,
                         duration: r.duration,
                         id: id.toString(),
                         imageUrl: r.image_url || undefined,
                         isLiked: false,
                         tags: r.tags ? (typeof r.tags === 'string' ? r.tags.split(',').map((t: string) => t.trim()) : r.tags) : [],
                         title: r.title || 'Generated Sound',
                     };
                 })
                 .filter((s): s is SoundItemData => s !== null);

              if (completedSounds.length > 0) {
                  message.success({ content: `Generation complete! ${completedSounds.length} sound(s) added.`, duration: 5, key: msgKey });
                  completedSounds.forEach(async (sound) => {
                    // Add to local UI state immediately
                    handleSoundGenerated(sound);
                    
                    // Then, attempt to save to backend/S3 (fire and forget for now)
                    try {
                      console.log(`[pollTaskStatus] Attempting to save sound ${sound.id} (${sound.title}) to backend...`);
                      const saveResponse = await fetch('/api/music/save-audio', {
                        body: JSON.stringify({
                          apiClipId: sound.id,
                          audioUrl: sound.audioUrl,
                          duration: sound.duration,
                          tags: sound.tags,
                          title: sound.title, // Pass the original API clip_id (stored in our sound.id)
                          // Add other relevant metadata if needed by backend
                        }),
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        method: 'POST',
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
                   message.warning({ content: `Task ${taskId} completed, but no valid audio data found in response.`, duration: 5, key: msgKey });
              }
        } else {
             console.error(`Polling error: SUCCESS status but no data array found. Data:`, taskData);
             message.error({ content: `Task completed but failed to parse results.`, duration: 5, key: msgKey });
        }
        // *** END PARSING ***
        setIsLoading(false);
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;

      } else if (failureStatuses.includes(currentStatus)) {
        console.error(`Task ${taskId} failed (MusicAPI status: ${currentStatus}). Data:`, taskData);
        message.error({ content: `Generation failed: ${taskData.detail || currentStatus || 'Unknown error'}`, duration: 8, key: msgKey });
        setIsLoading(false);
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      } else {
        console.warn(`Task ${taskId} has unknown MusicAPI status: ${currentStatus}. Treating as processing for now.`);
        message.info({ content: `Task ${taskId} has an unknown status: ${currentStatus}. Continuing to check...`, duration: 3, key: msgKey });
        pollingTimeoutRef.current = setTimeout(() => pollTaskStatus(taskId, modelUsed, msgKey), POLLING_INTERVAL);
      }

    } catch (error) {
      console.error(`Polling fetch/parse error for task ${taskId}:`, error);
      message.error({ content: 'Network or parsing error during status check. Check console.', duration: 5, key: msgKey });
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
        ? { lyrics: lyricsValue, style: styleValue, title: title }
        : { songDescription: songDescription }),
      // Add other fields if needed, like mv or negative_tags if controlled by frontend
      // mv: 'sonic-v3-5' // Example if frontend were to specify it
    };

    // Clean up empty/null values potentially sent
    Object.keys(requestBody).forEach(key => {
        if ((requestBody[key] === null || requestBody[key] === undefined || requestBody[key] === '') && // Keep boolean flags even if false, remove others
            typeof requestBody[key] !== 'boolean') {
                 delete requestBody[key];
            }
    });

    console.log('Sending generation request to /api/music/generate:', requestBody);

    // *** ADD LOG BEFORE FETCH ***
    console.log('[handleGenerate] Final requestBody being stringified:', requestBody);
    // *** END LOG ***

    try {
      const response = await fetch('/api/music/generate', {
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok || data.code !== 200) {
        console.error('Generation API error from /api/music/generate:', data);
        message.error({ content: `Generation failed: ${data.error || data.message || 'Unknown error'}`, duration: 5, key: generationMessageKey });
        setIsLoading(false);
      } else {
        const taskId = data?.data?.task_id;
        if (taskId) {
          console.log(`Generation started with task_id: ${taskId}`);
          message.success({ content: `Generation task started (ID: ${taskId}). Checking status...`, duration: 3, key: generationMessageKey });
          pollingAttemptsRef.current = 0;
          const initialPollDelay = 2000;
          setTimeout(() => {
             console.log(`Starting polling for ${taskId} after ${initialPollDelay}ms delay.`);
             pollTaskStatus(taskId, selectedModel, generationMessageKey);
          }, initialPollDelay);
        } else {
           console.error('No task_id received from /api/music/generate:', data);
           message.error({ content: 'Generation started but failed to get task ID.', duration: 5, key: generationMessageKey });
           setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch /api/music/generate:', error);
      message.error({ content: 'Failed to start generation. Check console for details.', duration: 5, key: generationMessageKey });
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
    <Flexbox gap={16} style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      <Title level={4} style={{ margin: 0 }}>AI Music Generation</Title>

      <Flexbox align="center" horizontal justify="space-between">
         <Space>
           <Switch checked={isCustomMode} disabled={isLoading} onChange={onIsCustomModeChange} size="small" />
           <Text style={{ color: isCustomMode ? 'white' : 'grey' }}>Custom Mode</Text>
         </Space>
         <Select
           disabled={isLoading}
           onChange={setSelectedModel}
           size="small"
           style={{ background: 'rgba(0,0,0,0.2)', border: 'none', width: 100 }}
           value={selectedModel}
         >
           <Option value="sonic">Sonic</Option>
           <Option value="studio">Studio</Option>
         </Select>
      </Flexbox>

      {!isCustomMode ? (
        <InputGroup title="Song Description">
          <Paragraph style={{ fontSize: 12, margin: '0 0 8px 0' }} type="secondary">
            Describe the style of music and the topic you want.
          </Paragraph>
          <TextArea
            disabled={isLoading}
            maxLength={400}
            onChange={(e) => onSongDescriptionChange(e.target.value)}
            placeholder="Enter song description..."
            rows={6}
            showCount
            value={songDescription}
          />
        </InputGroup>
      ) : (
        <Flexbox gap={16}>
          <InputGroup title="Title">
            <Input
               disabled={isLoading}
               maxLength={80}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="Enter a title"
               value={title}
            />
          </InputGroup>

          <InputGroup title="Style of Music">
             <Input
               disabled={isLoading}
               maxLength={120}
               onChange={(e) => onStyleChange(e.target.value)}
               placeholder="Enter style of music"
               value={styleValue}
             />
             <div style={{ color: 'grey', fontSize: 12, textAlign: 'right' }}>
               {styleValue.length}/120
             </div>
          </InputGroup>

          <InputGroup
             action={
                <Space>
                  <Text style={{ color: isInstrumental ? 'white' : 'grey' }}>Instrumental</Text>
                  <Switch checked={isInstrumental} disabled={isLoading} onChange={setIsInstrumental} size="small" />
                </Space>
             }
             title="Lyrics"
           >
             <Paragraph style={{ fontSize: 12, margin: '0 0 8px 0' }} type="secondary">
               Write your own lyrics.
             </Paragraph>
            <TextArea
              disabled={isLoading || isInstrumental}
              maxLength={2999}
              onChange={(e) => onLyricsChange(e.target.value)}
              placeholder="Enter lyrics... (Required unless Instrumental is checked)"
              rows={6}
              showCount
              value={lyricsValue}
            />
          </InputGroup>
        </Flexbox>
      )}

      <Button
        block
        icon={<Icon icon={Music2} />}
        loading={isLoading}
        onClick={handleGenerate}
        style={{ marginBottom: 24, marginTop: 16 }}
        type="primary"
      >
        {isLoading ? 'Generating...' : 'Generate'}
      </Button>

      <Flexbox gap={16} style={{ marginTop: 24, width: '100%' }}>
        <Title level={5}>Your gallery</Title>
        <SoundList
          currentPlayingId={currentPlayingId ?? undefined}
          likedSounds={likedSounds}
          listType="user"
          onDelete={handleDeleteSound}
          onLikeToggle={onLikeToggle}
          onPlayPause={onPlayPause}
          sounds={userSounds}
        />
      </Flexbox>
    </Flexbox>
  );
};

export default GenerationPanel; 