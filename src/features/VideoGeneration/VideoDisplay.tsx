'use client';

import React from 'react';
import { Spin, Alert, Empty } from 'antd';
import { Flexbox } from 'react-layout-kit';
import { useVideoProviderStore, type VideoProviderStore } from '@/store/videoProvider';

const VideoDisplay = () => {
  const { isLoading, videoUrl, error } = useVideoProviderStore(
    (s: VideoProviderStore) => ({
      isLoading: s.isLoading,
      videoUrl: s.videoUrl,
      error: s.error,
    })
  );

  const renderContent = () => {
    if (isLoading) {
      return <Spin size="large" tip="Generating video..." />;
    }

    if (error) {
      return <Alert message="Error Generating Video" description={String(error)} type="error" showIcon />;
    }

    if (videoUrl) {
      return (
        <video controls src={videoUrl} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }}>
          Your browser does not support the video tag.
        </video>
      );
    }

    return <Empty description="Video will appear here after generation" />;
  };

  return (
    <Flexbox align="center" justify="center" height="100%" width="100%">
      {renderContent()}
    </Flexbox>
  );
};

export default VideoDisplay; 