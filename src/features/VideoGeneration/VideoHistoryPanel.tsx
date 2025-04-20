'use client';

import React from 'react';
import { List, Typography, Empty } from 'antd';
import { Flexbox } from 'react-layout-kit';
import { useVideoProviderStore, type VideoProviderStore } from '@/store/videoProvider';

const { Text } = Typography;

const VideoHistoryPanel = () => {
  const history = useVideoProviderStore((s: VideoProviderStore) => s.history);

  return (
    <Flexbox height="100%" style={{ overflowY: 'auto', padding: '8px' }}>
      <h2>Video Generation History</h2>
      {history.length > 0 ? (
        <List
          dataSource={history}
          itemLayout="vertical"
          renderItem={(item) => (
            <List.Item key={item.id} style={{ padding: '8px 0' }}>
              <Text ellipsis={{ tooltip: item.prompt }}>
                Prompt: {item.prompt}
              </Text>
              <video
                controls
                preload="metadata"
                src={item.videoUrl}
                style={{ borderRadius: '4px', marginTop: '8px', width: '100%' }}
              />
            </List.Item>
          )}
        />
      ) : (
        <Flexbox align="center" flex={1} justify="center">
          <Empty description="History is empty" />
        </Flexbox>
      )}
    </Flexbox>
  );
};

export default VideoHistoryPanel; 