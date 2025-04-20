'use client';

import React, { memo, useEffect } from 'react';
import { Form, Select } from 'antd';
import { Flexbox } from 'react-layout-kit';
import { useVideoProviderStore } from '@/store/videoProvider';
import { type VideoProviderStore } from '@/store/videoProvider';
// Import type for initial values
import { shallow } from 'zustand/shallow';

interface VideoSettingsPanelProps {}

// Define available models (replace with actual data if needed)
const videoModels = [
  { label: 't2v-turbo', value: 't2v-turbo' },
  { label: 'Model B', value: 'model-b' },
  { label: 'Model C', value: 'model-c' },
];

const VideoSettingsPanel = memo<VideoSettingsPanelProps>(() => {
  const [form] = Form.useForm();

  // Select state and actions together - RE-ADD shallow
  const { model, setModel } = useVideoProviderStore(
    (s: VideoProviderStore) => ({
      model: s.model,
      setModel: s.setModel,
    }),
    shallow // Re-add shallow
  );

  // Simplified effect to set form value when model changes
  useEffect(() => {
    if (model !== null && model !== undefined) {
      console.log('[VideoSettingsPanel Effect] Setting form value:', model);
      form.setFieldsValue({ model });
    }
  }, [model]);

  const handleModelChange = (value: string) => {
    // Need to check if setModel exists again
    if (setModel) {
      console.log('[VideoSettingsPanel] Updating model:', value);
      setModel(value);
    } else {
      console.error('[VideoSettingsPanel] setModel action is undefined after selection change.');
    }
  };

  console.log('[VideoSettingsPanel Render] model:', model);

  return (
    <Flexbox gap={16} style={{ width: '100%' }}>
      <h2>Video Settings</h2>
      <Form form={form} layout="vertical" style={{ padding: 16 }}>
        <Form.Item label="Model" name="model">
          <Select
            onChange={handleModelChange} // Update store on change
            options={videoModels} // Use defined models
            value={model} // Controlled component tied to store state
          />
        </Form.Item>
      </Form>
    </Flexbox>
  );
});

export default VideoSettingsPanel; 