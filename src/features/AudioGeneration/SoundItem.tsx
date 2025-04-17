import React, { useState, useEffect } from 'react';
import { Avatar, Button, Card, Tag, Typography } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, HeartOutlined, HeartFilled, PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { Flexbox } from 'react-layout-kit';
import { formatDuration } from './utils';
import { extractAudioMetadata, AudioMetadata } from './utils/audioMetadata';

const { Text } = Typography;

export interface SoundItemData {
  id: string;
  title?: string;
  audioUrl: string;
  imageUrl?: string;
  duration?: number;
  genre?: string;
  tags?: string[];
  creatorName?: string;
  isLiked?: boolean;
}

interface SoundItemProps extends SoundItemData {
  isPlaying: boolean;
  isLiked: boolean;
  onPlayPause: (id: string, audioUrl: string) => void;
  onLikeToggle: (id: string) => void;
  onUsePrompt?: (id: string) => void;
  listType: 'reference' | 'user';
  onDelete?: (id: string) => void;
}

const SoundItem: React.FC<SoundItemProps> = ({
  id,
  title = 'Untitled Sound',
  audioUrl,
  imageUrl,
  duration,
  genre,
  tags,
  creatorName,
  isPlaying,
  isLiked,
  onPlayPause,
  onLikeToggle,
  onUsePrompt,
  listType,
  onDelete,
}) => {
  const [imageError, setImageError] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [metadata, setMetadata] = useState<AudioMetadata>({});

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const audioMetadata = await extractAudioMetadata(audioUrl);
        setMetadata(audioMetadata);
      } catch (error) {
        console.error('Error loading audio metadata:', error);
      }
    };

    loadMetadata();
  }, [audioUrl]);

  const handlePlayPauseClick = () => {
    if (!audioError) {
      onPlayPause(id, audioUrl);
    }
  };

  const handleLikeClick = () => {
    onLikeToggle(id);
  };

  const handleUsePromptClick = () => {
    if (onUsePrompt) onUsePrompt(id);
  };

  const handleDeleteClick = () => {
    if (onDelete) onDelete(id);
  };

  const handleImageError = () => {
    setImageError(true);
    return false;
  };

  const handleAudioError = () => {
    setAudioError(true);
  };

  const displayTitle = metadata.title || title;
  const displayDuration = metadata.duration || duration;
  const displayImage = !imageError ? (metadata.cover || imageUrl) : undefined;

  return (
    <Card 
      size="small" 
      hoverable 
      style={{ background: 'rgba(255,255,255,0.08)', border: 'none' }}
      styles={{ body: { padding: '12px' } }}
    >
      <Flexbox horizontal gap={12} align="center">
        <Button 
          type="text" 
          shape="circle"
          icon={isPlaying 
            ? <PauseCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} /> 
            : <PlayCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          } 
          onClick={handlePlayPauseClick}
          size="large"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={audioError}
        />
        
        <Avatar 
          shape="square" 
          size={48} 
          src={displayImage} 
          onError={handleImageError}
        />

        <Flexbox flex={1} gap={4} style={{ minWidth: 0 }}>
          <Text strong style={{ color: 'white' }} ellipsis={{ tooltip: displayTitle }}>
            {displayTitle}
          </Text>
          <Flexbox horizontal gap={4} align="center" style={{ flexWrap: 'nowrap' }}>
            {typeof displayDuration === 'number' && (
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {formatDuration(displayDuration)}
              </Text>
            )}
            {genre && (
              <>
                {typeof displayDuration === 'number' && (
                  <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>|</span>
                )}
              </>
            )}
          </Flexbox>
          <Flexbox horizontal gap={4} align="center" style={{ flexWrap: 'wrap', marginTop: 4 }}>
            {genre && (
               <Tag color="blue" style={{ margin: '2px 0' }}>{genre}</Tag>
            )}
           {tags && tags.length > 0 && genre && (
              <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>|</span>
           )}
           {tags?.slice(0, 3).map(tag => (
             <Tag key={tag} color="default" style={{ margin: '2px 0' }}>{tag}</Tag>
           ))}
           {tags && tags.length > 3 && <Tag style={{ margin: '2px 0' }}>...</Tag>}
         </Flexbox>
        </Flexbox>

        <Flexbox horizontal align="center" gap={0}>
          {listType === 'reference' && onUsePrompt && (
            <Button 
              type="text"
              icon={<PlusCircleOutlined />}
              onClick={handleUsePromptClick}
              title="Use as Prompt"
            />
          )}
          
          <Button 
            type="text"
            icon={isLiked ? <HeartFilled style={{ color: 'red' }} /> : <HeartOutlined />} 
            onClick={handleLikeClick}
            title={isLiked ? 'Unlike' : 'Like'}
          />

          {listType === 'user' && onDelete && (
             <Button 
               type="text" 
               danger
               icon={<DeleteOutlined />} 
               onClick={handleDeleteClick}
               title="Delete from gallery"
             />
          )}
        </Flexbox>
      </Flexbox>
    </Card>
  );
};

export default SoundItem; 