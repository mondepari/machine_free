'use client';

import React, { useState,  memo } from 'react';
import { Flexbox } from 'react-layout-kit';
import { useTranslation } from 'react-i18next';
import { message, Button, Space, Typography, Modal } from 'antd';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { GenerationPanel } from '@/features/AudioGeneration';
import SoundList from '@/features/AudioGeneration/SoundList';
import { SoundItemData } from '@/features/AudioGeneration/SoundItem';
import { aiReferenceSounds, trendingSounds } from '@/features/AudioGeneration/mockSounds';
import Title from 'antd/es/typography/Title';
import { 
  PlayCircleFilled, 
  PauseCircleFilled, 
  FastBackwardFilled, 
  FastForwardFilled, 
  HeartOutlined
} from '@ant-design/icons';
import WaveformDisplay from '@/features/AudioEditor/WaveformDisplay';
import { formatDuration } from '@/features/AudioGeneration/utils';

const { Text } = Typography;

// Style for the resize handle
const resizeHandleStyle: React.CSSProperties = {
  
alignItems: 'center', 
  
// Make the handle area wider for easier grabbing
background: '#555', 
  
borderLeft: '1px solid #444',
  
borderRight: '1px solid #444',
  // A visible color for the handle
cursor: 'col-resize',
  display: 'flex',
  justifyContent: 'center',
  width: '8px',
};

const Audio = memo(() => {
  const { t } = useTranslation('common');

  // === State ===
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [currentAudioSrc, setCurrentAudioSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [likedSounds, setLikedSounds] = useState<Record<string, boolean>>({});
  const [songDescription, setSongDescription] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [style, setStyle] = useState<string>('');
  const [lyrics, setLyrics] = useState<string>('');
  const [currentAiReferenceSounds, setCurrentAiReferenceSounds] = useState<SoundItemData[]>(aiReferenceSounds);
  const [currentTrendingSounds, setCurrentTrendingSounds] = useState<SoundItemData[]>(trendingSounds);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [isFavoritesModalVisible, setIsFavoritesModalVisible] = useState<boolean>(false);

  // === Handlers ===

  const handleAudioError = (e: Event | string) => {
    console.error('Audio Playback Error (Parent):', e);
    message.error('Audio playback error.');
    setCurrentPlayingId(null);
    setCurrentAudioSrc(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const handlePlayPause = (id: string, audioSrc: string) => {
    console.log(`[handlePlayPause] Called with id: ${id}, src: ${audioSrc}`);
    console.log(`[handlePlayPause] Current state before change: currentPlayingId=${currentPlayingId}, isPlaying=${isPlaying}`);

    if (currentPlayingId === id) {
      console.log(`[handlePlayPause] Toggling play state for track: ${id}`);
      setIsPlaying(!isPlaying);
    } else {
      console.log(`[handlePlayPause] Playing new track: ${id}.`);
      setCurrentAudioSrc(audioSrc);
      setCurrentPlayingId(id);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(0);
    }
  };

  const handleLikeToggle = (id: string) => {
    console.log('Like toggled (Parent):', id);
    setLikedSounds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUseReferencePrompt = (id: string) => {
    console.log('Use reference prompt clicked (Parent):', id);
    const soundToUse = currentAiReferenceSounds.find((sound: SoundItemData) => sound.id === id);
    if (!soundToUse) {
        message.error('Could not find reference sound data.');
        return;
    }
    const promptText = soundToUse.title || '';
    if (isCustomMode) {
      setStyle(promptText);
      setIsCustomMode(true); 
      message.info(`Style of Music set to: "${promptText}"`);
    } else {
      setSongDescription(promptText);
      setIsCustomMode(false); 
      message.info(`Song description set to: "${promptText}"`);
    }
  };

  const handleTimeUpdate = (time: number) => {
    if (!isSeeking) {
      setCurrentTime(time);
    }
  };

  const handleLoadedMetadata = (durationValue: number) => {
    console.log('Loaded metadata (Parent), duration:', durationValue);
    setDuration(durationValue);
  };

  const handleAudioFinish = () => {
    console.log('Audio finished (Parent)');
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekEnd = (value: number) => {
    if (currentAudioSrc) {
      setCurrentTime(value);
    }
    setIsSeeking(false);
  };

  const playingSoundInfo = 
     [...currentAiReferenceSounds, ...currentTrendingSounds]
     .find(s => s.id === currentPlayingId);

  const handleMainPlayPauseClick = () => {
    console.log(`[handleMainPlayPauseClick] Clicked. Current state: currentPlayingId=${currentPlayingId}, isPlaying=${isPlaying}`);
    if (currentPlayingId) {
        console.log(`[handleMainPlayPauseClick] Toggling isPlaying state.`);
        setIsPlaying(!isPlaying); 
    } else {
        console.log('[handleMainPlayPauseClick] Clicked, but no currentPlayingId. Doing nothing.');
    }
  };

  // Placeholder for showing favorites
  const handleShowFavorites = () => {
    console.log('Show Favorites clicked!');
    setIsFavoritesModalVisible(true);
  };

  // Calculate favorite sounds based on likedSounds state
  const favoriteSounds = [
    ...currentAiReferenceSounds,
    ...currentTrendingSounds,
    // Add userSounds here if they should be included and likeable
    // Currently, userSounds state is inside GenerationPanel
  ].filter(sound => likedSounds[sound.id]);

  return (
    <>
      <PanelGroup direction="horizontal" style={{ height: '100%' }}>
        <Panel defaultSize={30} id="generation-panel" maxSize={50} minSize={25}>
          <GenerationPanel
             currentPlayingId={currentPlayingId}
             isCustomMode={isCustomMode}
             likedSounds={likedSounds}
             lyricsValue={lyrics}
             onIsCustomModeChange={setIsCustomMode}
             onLikeToggle={handleLikeToggle}
             onLyricsChange={setLyrics}
             onPlayPause={handlePlayPause}
             onSongDescriptionChange={setSongDescription}
             onStyleChange={setStyle}
             songDescription={songDescription}
             styleValue={style}
          />
        </Panel>
        
        <PanelResizeHandle style={resizeHandleStyle} /> 

        <Panel id="main-audio-content">
          {/* @ts-ignore */}
          <Flexbox direction={'column'} style={{ height: '100%' }}>
            <Flexbox 
              align="center" 
              justify="space-between"
              style={{ borderBottom: '1px solid #333', minHeight: '80px', padding: 16 }}
            >
              <Flexbox flex={1} style={{ marginRight: 16, minHeight: 60, width: '100%' }}>
                  <WaveformDisplay 
                     isPlaying={isPlaying} 
                     onFinish={handleAudioFinish}
                     onLoadedMetadata={handleLoadedMetadata}
                     onSeek={handleSeekEnd}
                     onTimeUpdate={handleTimeUpdate}
                     url={currentAudioSrc}
                  />
              </Flexbox>
              
              <Flexbox align="center" gap={16} style={{ flexShrink: 0 }}>
                  {/* @ts-ignore */}
                  <Flexbox align="center" direction={'column'} flex={1} style={{ minWidth: 100, textAlign: 'center' }}>
                    <Text ellipsis strong style={{ color: 'white'}}>
                      {playingSoundInfo ? playingSoundInfo.title : 'Nothing Playing'}
                    </Text>
                    <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }} type="secondary">
                       {formatDuration(currentTime)} / {formatDuration(duration)}
                    </Text>
                  </Flexbox>

                  {/* Playback Controls & Favorites Wrapper - Centered */}
                  <Flexbox flex={1} justify="center"> 
                    <Space size="large" style={{ justifyContent: 'center' }}> 
                        <Button disabled icon={<FastBackwardFilled style={{ fontSize: 28 }} />} shape="circle" type="text" /> 
                        <Button 
                            disabled={!currentAudioSrc} 
                            icon={isPlaying ? <PauseCircleFilled style={{ fontSize: 36 }} /> : <PlayCircleFilled style={{ fontSize: 36 }} />} 
                            onClick={handleMainPlayPauseClick}
                            shape="circle"
                            size="large" 
                            type="text"
                        />
                        <Button disabled icon={<FastForwardFilled style={{ fontSize: 28 }} />} shape="circle" type="text" /> 
                        <Button 
                          icon={<HeartOutlined style={{ fontSize: 20 }} />} 
                          onClick={handleShowFavorites} 
                          shape="circle"
                          style={{ color: 'white'}} 
                          title="Show Favorites"
                          type="text"
                        />
                    </Space>
                  </Flexbox>
              </Flexbox>
            </Flexbox>

            <Flexbox flex={1} gap={16} horizontal style={{ overflow: 'hidden', padding: 16 }}> 
              <Flexbox flex={1} gap={8} style={{ height: '100%', minWidth: 0, overflowY: 'auto' }}> 
                <Title level={5} style={{ margin: 0, paddingBottom: 8 }}>AI Reference</Title>
                <SoundList
                  currentPlayingId={currentPlayingId ?? undefined} 
                  likedSounds={likedSounds}
                  listType="reference"
                  onLikeToggle={handleLikeToggle}
                  onPlayPause={handlePlayPause}
                  onUsePrompt={handleUseReferencePrompt}
                  sounds={currentAiReferenceSounds}
                />
              </Flexbox>
              <Flexbox flex={1} gap={8} style={{ height: '100%', minWidth: 0, overflowY: 'auto' }}> 
                <Title level={5} style={{ margin: 0, paddingBottom: 8 }}>Trending</Title>
                <SoundList
                  currentPlayingId={currentPlayingId ?? undefined} 
                  likedSounds={likedSounds}
                  listType="reference"
                  onLikeToggle={handleLikeToggle}
                  onPlayPause={handlePlayPause}
                  sounds={currentTrendingSounds} 
                />
              </Flexbox>
            </Flexbox>
          </Flexbox>
        </Panel>
      </PanelGroup>

      {/* Favorites Modal */}
      <Modal 
        footer={null} // No default buttons 
        onCancel={() => setIsFavoritesModalVisible(false)} 
        open={isFavoritesModalVisible} 
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }} // Make body scrollable
        title="Favorite Sounds"
        width={600} // Adjust width as needed
      >
        {favoriteSounds.length > 0 ? (
          <SoundList
            currentPlayingId={currentPlayingId ?? undefined}
            likedSounds={likedSounds}
            onLikeToggle={handleLikeToggle}
            onPlayPause={handlePlayPause}
            sounds={favoriteSounds}
            listType="reference" // Or create a new type if needed
            // Add onDelete or onUsePrompt if applicable to favorites view
          />
        ) : (
          <Text type="secondary">You haven't liked any sounds yet.</Text>
        )}
      </Modal>
    </>
  );
});

export default Audio; 