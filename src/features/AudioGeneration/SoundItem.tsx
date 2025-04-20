import React, { useState, useEffect } from 'react';
import { Avatar, Button, Card, Tag, Typography } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, HeartOutlined, HeartFilled, PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { Flexbox } from 'react-layout-kit';
import { formatDuration } from './utils';
import { extractAudioMetadata, AudioMetadata } from './utils/audioMetadata';

const { Text } = Typography;

export interface SoundItemData {
  audioUrl: string;
  creatorName?: string;
  duration?: number;
  genre?: string;
  id: string;
  imageUrl?: string;
  isLiked?: boolean;
  tags?: string[];
  title?: string;
}

interface SoundItemProps extends SoundItemData {
  isLiked: boolean;
  isPlaying: boolean;
  listType: 'reference' | 'user';
  onDelete?: (id: string) => void;
  onLikeToggle: (id: string) => void;
  onPlayPause: (id: string, audioUrl: string) => void;
  onUsePrompt?: (id: string) => void;
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
      hoverable 
      size="small" 
      style={{ background: 'rgba(255,255,255,0.08)', border: 'none' }}
      styles={{ body: { padding: '12px' } }}
    >
      <Flexbox align="center" gap={12} horizontal>
        <Button 
          aria-label={isPlaying ? 'Pause' : 'Play'} 
          disabled={audioError}
          icon={isPlaying 
            ? <PauseCircleOutlined style={{ color: '#1890ff', fontSize: 24 }} /> 
            : <PlayCircleOutlined style={{ color: '#1890ff', fontSize: 24 }} />
          } 
          onClick={handlePlayPauseClick}
          shape="circle"
          size="large"
          type="text"
        />
        
        <Avatar 
          onError={handleImageError} 
          shape="square" 
          size={48} 
          src={displayImage}
        />

        <Flexbox flex={1} gap={4} style={{ minWidth: 0 }}>
          <Text ellipsis={{ tooltip: displayTitle }} strong style={{ color: 'white' }}>
            {displayTitle}
          </Text>
          <Flexbox align="center" gap={4} horizontal style={{ flexWrap: 'nowrap' }}>
            {typeof displayDuration === 'number' && (
              <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }} type="secondary">
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
          <Flexbox align="center" gap={4} horizontal style={{ flexWrap: 'wrap', marginTop: 4 }}>
            {genre && (
               <Tag color="blue" style={{ margin: '2px 0' }}>{genre}</Tag>
            )}
           {tags && tags.length > 0 && genre && (
              <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>|</span>
           )}
           {tags?.slice(0, 3).map(tag => (
             <Tag color="default" key={tag} style={{ margin: '2px 0' }}>{tag}</Tag>
           ))}
           {tags && tags.length > 3 && <Tag style={{ margin: '2px 0' }}>...</Tag>}
         </Flexbox>
        </Flexbox>

        <Flexbox align="center" gap={0} horizontal>
          {listType === 'reference' && onUsePrompt && (
            <Button 
              icon={<PlusCircleOutlined />}
              onClick={handleUsePromptClick}
              title="Use as Prompt"
              type="text"
            />
          )}
          
          <Button 
            icon={isLiked ? <HeartFilled style={{ color: 'red' }} /> : <HeartOutlined />}
            onClick={handleLikeClick} 
            title={isLiked ? 'Unlike' : 'Like'}
            type="text"
          />

          {listType === 'user' && onDelete && (
             <Button 
               danger 
               icon={<DeleteOutlined />}
               onClick={handleDeleteClick} 
               title="Delete from gallery"
               type="text"
             />
          )}
        </Flexbox>
      </Flexbox>
    </Card>
  );
};

export default SoundItem; 