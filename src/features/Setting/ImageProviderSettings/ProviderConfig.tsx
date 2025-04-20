'use client';

import React, { memo, useCallback } from 'react';
import { Form, Input, Switch } from 'antd';
import { createStyles } from 'antd-style';

import { useTranslation } from 'react-i18next';

import { useSettingStore } from '@/store/settings';


const useStyles = createStyles(({ css, token }) => ({
  desc: css`
    color: ${token.colorTextDescription};
  `,
  title: css`
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  `,
}));

interface ProxyUrlConfig {
  desc?: string;
  placeholder: string;
  title?: string;
}

interface ProviderConfigProps {
  id: string;
  name: string;
  proxyUrl?: {
    desc?: string;
    placeholder: string;
    title?: string;
  };
  showApiKey?: boolean;
  title: string;
}

const ProviderConfig = memo<ProviderConfigProps>(({ id, title, showApiKey, proxyUrl }) => {
  const { t } = useTranslation('common');
  const { styles } = useStyles();
  const [provider, updateProvider] = useSettingStore((s) => [
    s.imageProviders[id as keyof typeof s.imageProviders],
    s.updateImageProvider,
  ]);

  const handleEnableChange = useCallback(
    (checked: boolean) => {
      updateProvider(id as 'default' | 'custom', { enabled: checked });
    },
    [id, updateProvider],
  );

  const handleApiKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateProvider(id as 'default' | 'custom', { apiKey: e.target.value });
    },
    [id, updateProvider],
  );

  const handleProxyUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateProvider(id as 'default' | 'custom', {
        proxyUrl: { ...proxyUrl, title: e.target.value },
      });
    },
    [id, proxyUrl, updateProvider],
  );

  return (
    <Form layout="vertical">
      <Form.Item label={title}>
        <Switch
          checked={provider.enabled}
          onChange={handleEnableChange}
        />
      </Form.Item>
      {provider.enabled && (
        <>
          {showApiKey && (
            <Form.Item label="API Key">
              <Input.Password
                onChange={handleApiKeyChange}
                placeholder="Enter your API key"
                value={provider.apiKey}
              />
            </Form.Item>
          )}
          {proxyUrl && (
            <Form.Item
              label={proxyUrl.title || 'API Endpoint'}
              tooltip={proxyUrl.desc}
            >
              <Input
                onChange={handleProxyUrlChange}
                placeholder={proxyUrl.placeholder}
                value={provider.proxyUrl?.title}
              />
            </Form.Item>
          )}
        </>
      )}
    </Form>
  );
});

export default ProviderConfig; 