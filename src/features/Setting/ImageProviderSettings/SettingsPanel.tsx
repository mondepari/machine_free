'use client';

import { Collapse } from 'antd';
import { Settings } from 'lucide-react';
import { memo } from 'react';
import { createStyles } from 'antd-style';

import { DEFAULT_IMAGE_PROVIDER_LIST } from '@/config/imageProviders';
import ProviderConfig from './ProviderConfig';

const useStyles = createStyles(({ css, token }) => ({
  collapse: css`
    .ant-collapse-header-text {
      color: ${token.colorText} !important;
      font-size: 14px;
      font-weight: normal;
    }
  `,
}));

const SettingsPanel = memo(() => {
  const { styles } = useStyles();
  
  const getProviderDisplayName = (id: string) => {
    return id === 'default' ? 'Провайдер по умолчанию' : 'Пользовательский провайдер';
  };

  return (
    <Collapse
      className={styles.collapse}
      defaultActiveKey={['default']}
      expandIcon={({ isActive }) => <Settings size={16} style={{ marginRight: 8 }} />}
      ghost
      items={DEFAULT_IMAGE_PROVIDER_LIST.map((provider) => ({
        children: (
          <ProviderConfig
            id={provider.id}
            key={provider.id}
            name={provider.name}
            proxyUrl={provider.settings.proxyUrl}
            showApiKey={provider.settings.showApiKey}
            title={getProviderDisplayName(provider.id)}
          />
        ),
        key: provider.id,
        label: getProviderDisplayName(provider.id),
      }))}
    />
  );
});

export default SettingsPanel; 