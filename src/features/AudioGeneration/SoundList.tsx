import { Typography } from 'antd';
import React from 'react';
import { Flexbox } from 'react-layout-kit';
import SoundItem, { SoundItemData } from './SoundItem';

// Remove Title import if no longer used
// const { Title } = Typography; 

interface SoundListProps {
  // title: string; // Removed prop
  sounds: SoundItemData[];
  currentPlayingId?: string;
  onPlayPause: (id: string, audioSrc: string) => void;
  onLikeToggle: (id: string) => void;
  onUsePrompt?: (id: string) => void;
  likedSounds: Record<string, boolean>;
  listType: 'reference' | 'user';
  onDelete?: (id: string) => void;
}

const SoundList: React.FC<SoundListProps> = ({
  // title, // Removed from destructuring
  sounds,
  currentPlayingId,
  onPlayPause,
  onLikeToggle,
  onUsePrompt,
  likedSounds,
  listType,
  onDelete,
}) => {
  if (!sounds || sounds.length === 0) {
    // Optionally display a more specific message based on listType?
    return <Flexbox style={{ padding: '16px 0', color: 'grey' }}>No sounds in this list.</Flexbox>;
  }

  return (
    // Removed outer Flexbox and Title element
    <Flexbox gap={12} style={{ width: '100%' }}> 
      {/* <Title level={5} style={{ margin: '0 0 8px 0' }}>{title}</Title> */}
      {sounds.map((item) => (
        <SoundItem
          key={item.id}
          id={item.id}
          title={item.title}
          audioUrl={item.audioUrl}
          imageUrl={item.imageUrl}
          duration={item.duration}
          tags={item.tags}
          isPlaying={item.id === currentPlayingId}
          isLiked={!!likedSounds[item.id]}
          onPlayPause={onPlayPause}
          onLikeToggle={onLikeToggle}
          onUsePrompt={onUsePrompt}
          listType={listType}
          onDelete={onDelete}
          // TODO: Pass onDelete handler for user list if needed
        />
      ))}
    </Flexbox>
  );
};

export default SoundList; 