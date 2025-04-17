'use client';

import { Form, Input } from 'antd';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

// Import the user store and correct selector
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors'; // Corrected import name
import type { VideoProviderSettings as VideoSettings } from '@/store/user/slices/videoProvider/initialState'; // Import the type

const VideoProviderSettings = memo(() => {
  const [form] = Form.useForm();

  // Select state and update action directly
  const videoSettings = useUserStore(settingsSelectors.currentVideoProviderSettings) as VideoSettings | undefined;
  const updateVideoSettings = useUserStore((s) => s.updateVideoProviderConfig);

  const handleValuesChange = (changedValues: any, allValues: any) => {
    console.log('[VideoProviderSettings onValuesChange] Values changed:', allValues);
    if (updateVideoSettings) {
        updateVideoSettings(allValues);
    } else {
        console.error('[VideoProviderSettings] updateVideoSettings action is undefined!')
    }
  };

  console.log('[VideoProviderSettings Render] videoSettings from store:', videoSettings);

  return (
    <Flexbox gap={16} style={{ maxWidth: 600 }}>
      <h3>Video Provider Settings</h3>
      <p>Configure your video generation provider API key and endpoint.</p>
      <Form
        form={form}
        layout="vertical"
        initialValues={videoSettings || {}} // Set initialValues from store state (or empty if undefined)
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          label="API Key"
          tooltip="Enter your API Key for the video provider."
          name="videoApiKey"
        >
          <Input.Password placeholder="sk-... or other API Key format" />
        </Form.Item>
        <Form.Item
          label="Endpoint URL"
          tooltip="Enter the API endpoint URL for video generation."
          name="videoEndpoint"
        >
          <Input placeholder="https://your-provider.com/api/v1/videos" />
        </Form.Item>
      </Form>
    </Flexbox>
  );
});

export default VideoProviderSettings; 