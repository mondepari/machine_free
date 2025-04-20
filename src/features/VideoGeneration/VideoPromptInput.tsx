'use client';

import React, { memo } from 'react';
import { Input } from 'antd';
import { ActionIcon } from '@lobehub/ui';
import { SendHorizonal } from 'lucide-react';
import { Flexbox } from 'react-layout-kit';
import { shallow } from 'zustand/shallow';

import { useVideoProviderStore } from '@/store/videoProvider';
import { type VideoProviderStore } from '@/store/videoProvider';

const { TextArea } = Input;

interface VideoPromptInputProps {
  className?: string;
  style?: React.CSSProperties;
}

const VideoPromptInput = memo<VideoPromptInputProps>(({ className, style }) => {
  // const { t } = useTranslation('common'); // Keep removed

  // Select state and actions together - RE-ADD shallow
  const { prompt, isLoading, setPrompt, generateVideo } = useVideoProviderStore(
    (s: VideoProviderStore) => ({
      generateVideo: s.generateVideo,
      isLoading: s.isLoading,
      prompt: s.prompt,
      setPrompt: s.setPrompt,
    }),
    shallow // Re-add shallow
  );

  // Removed separate selectors

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Need to check if setPrompt exists again, as it comes from the combined selector
    if (setPrompt) {
      setPrompt(event.target.value);
    } else {
      console.error('[VideoPromptInput] setPrompt action is undefined after selection change.');
    }
  };

  const handleGenerate = () => {
    // Need to check if generateVideo exists again
    if (generateVideo) {
      console.log('[VideoPromptInput] Triggering generateVideo action...');
      generateVideo();
    } else {
      console.error('[VideoPromptInput] generateVideo action is undefined after selection change.');
    }
  };

  // Debug log
  console.log('[VideoPromptInput Render] prompt:', prompt, 'isLoading:', isLoading);

  const disabled = isLoading;

  return (
    <Flexbox className={className} direction="horizontal" gap={8} padding={8} style={style}>
      <TextArea
        autoSize={{ maxRows: 8, minRows: 1 }}
        onChange={handlePromptChange}
        placeholder="Enter video prompt..." // Placeholder text
        value={prompt || ''}
      />
      <ActionIcon
        disable={disabled || !prompt?.trim()}
        icon={SendHorizonal}
        onClick={handleGenerate}
        title="Generate Video" // Placeholder text
      />
    </Flexbox>
  );
});

export default VideoPromptInput; 