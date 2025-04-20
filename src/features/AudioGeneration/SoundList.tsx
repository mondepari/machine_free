import React from 'react';
import { Flexbox } from 'react-layout-kit';
import SoundItem, { SoundItemData } from './SoundItem';

// Remove Title import if no longer used
// const { Title } = Typography; 

interface SoundListProps {
  currentPlayingId?: string;
  likedSounds: Record<string, boolean>;
  listType: 'reference' | 'user';
  onDelete?: (id: string) => void;
  onLikeToggle: (id: string) => void;
  onPlayPause: (id: string, audioSrc: string) => void;
  onUsePrompt?: (id: string) => void;
  // title: string; // Removed prop
  sounds: SoundItemData[];
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
    return <Flexbox style={{ color: 'grey', padding: '16px 0' }}>No sounds in this list.</Flexbox>;
  }

  return (
    // Removed outer Flexbox and Title element
    <Flexbox gap={12} style={{ width: '100%' }}> 
      {/* <Title level={5} style={{ margin: '0 0 8px 0' }}>{title}</Title> */}
      {sounds.map((item) => (
        <SoundItem
          audioUrl={item.audioUrl}
          duration={item.duration}
          id={item.id}
          imageUrl={item.imageUrl}
          isLiked={!!likedSounds[item.id]}
          isPlaying={item.id === currentPlayingId}
          key={item.id}
          listType={listType}
          onLikeToggle={onLikeToggle}
          onPlayPause={onPlayPause}
          onUsePrompt={onUsePrompt}
          tags={item.tags}
          title={item.title}
          onDelete={onDelete}
          // TODO: Pass onDelete handler for user list if needed
        />
      ))}
    </Flexbox>
  );
};

export default SoundList; 