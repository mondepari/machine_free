'use client';

import { Collapse } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_IMAGE_PROVIDER_LIST } from '@/config/imageProviders';

import ProviderConfig from './ProviderConfig';

const useStyles = createStyles(({ css, token }) => ({
  desc: css`
    color: ${token.colorTextDescription};
  `,
  header: css`
    font-size: 16px;
    font-weight: 600;
  `,
}));

const ProviderList = memo(() => {
  const { t } = useTranslation('setting');
  const { styles } = useStyles();

  return (
    <Collapse
      defaultActiveKey={['default']}
      items={DEFAULT_IMAGE_PROVIDER_LIST.map((provider) => ({
        children: (
          <ProviderConfig
            id={provider.id}
            key={provider.id}
            name={provider.name}
            proxyUrl={provider.settings.proxyUrl}
            showApiKey={provider.settings.showApiKey}
            title={provider.name}
          />
        ),
        header: (
          <div>
            <div className={styles.header}>{provider.name}</div>
            {provider.description && <div className={styles.desc}>{provider.description}</div>}
          </div>
        ),
        key: provider.id,
      }))}
    />
  );
});

export default ProviderList; 