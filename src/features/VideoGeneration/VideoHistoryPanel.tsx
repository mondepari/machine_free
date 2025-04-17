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
          itemLayout="vertical"
          dataSource={history}
          renderItem={(item) => (
            <List.Item key={item.id} style={{ padding: '8px 0' }}>
              <Text ellipsis={{ tooltip: item.prompt }}>
                Prompt: {item.prompt}
              </Text>
              <video
                src={item.videoUrl}
                controls
                style={{ width: '100%', marginTop: '8px', borderRadius: '4px' }}
                preload="metadata"
              />
            </List.Item>
          )}
        />
      ) : (
        <Flexbox align="center" justify="center" flex={1}>
          <Empty description="History is empty" />
        </Flexbox>
      )}
    </Flexbox>
  );
};

export default VideoHistoryPanel; 