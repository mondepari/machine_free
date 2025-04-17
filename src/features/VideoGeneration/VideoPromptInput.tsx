'use client';

import React, { memo } from 'react';
import { Button, Input, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { ActionIcon } from '@lobehub/ui';
import { SendHorizonal } from 'lucide-react';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
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
      prompt: s.prompt,
      isLoading: s.isLoading,
      setPrompt: s.setPrompt,
      generateVideo: s.generateVideo,
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
    <Flexbox className={className} style={style} gap={8} direction="horizontal" padding={8}>
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