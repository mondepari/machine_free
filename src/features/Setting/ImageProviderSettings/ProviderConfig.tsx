'use client';

import { Form, Input, Switch } from 'antd';
import { createStyles } from 'antd-style';
import { debounce } from 'lodash-es';
import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useImageProvider } from '@/hooks/useImageProvider';
import { GlobalImageProviderKey } from '@/types/imagine/settings';
import { useSettingStore } from '@/store/settings';

import ModelChecker from './ModelChecker';

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
  title?: string;
  desc?: string;
  placeholder: string;
}

interface ProviderConfigProps {
  id: string;
  title: string;
  name: string;
  showApiKey?: boolean;
  proxyUrl?: {
    title?: string;
    desc?: string;
    placeholder: string;
  };
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
                value={provider.apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your API key"
              />
            </Form.Item>
          )}
          {proxyUrl && (
            <Form.Item
              label={proxyUrl.title || 'API Endpoint'}
              tooltip={proxyUrl.desc}
            >
              <Input
                value={provider.proxyUrl?.title}
                onChange={handleProxyUrlChange}
                placeholder={proxyUrl.placeholder}
              />
            </Form.Item>
          )}
        </>
      )}
    </Form>
  );
});

export default ProviderConfig; 