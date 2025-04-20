'use client';

import React from 'react';
import { Spin, Alert, Empty } from 'antd';
import { Flexbox } from 'react-layout-kit';
import { useVideoProviderStore, type VideoProviderStore } from '@/store/videoProvider';

const VideoDisplay = () => {
  const { isLoading, videoUrl, error } = useVideoProviderStore(
    (s: VideoProviderStore) => ({
      error: s.error,
      isLoading: s.isLoading,
      videoUrl: s.videoUrl,
    })
  );

  const renderContent = () => {
    if (isLoading) {
      return <Spin size="large" tip="Generating video..." />;
    }

    if (error) {
      return <Alert description={String(error)} message="Error Generating Video" showIcon type="error" />;
    }

    if (videoUrl) {
      return (
        <video controls src={videoUrl} style={{ borderRadius: '8px', maxHeight: '100%', maxWidth: '100%' }}>
          Your browser does not support the video tag.
        </video>
      );
    }

    return <Empty description="Video will appear here after generation" />;
  };

  return (
    <Flexbox align="center" height="100%" justify="center" width="100%">
      {renderContent()}
    </Flexbox>
  );
};

export default VideoDisplay; 