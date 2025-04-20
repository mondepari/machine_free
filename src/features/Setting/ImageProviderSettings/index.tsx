'use client';

import { Card } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import ProviderConfig from './ProviderConfig';
import ModelChecker from './ModelChecker';

const ImageProviderSettings = memo(() => {
  const { t } = useTranslation('setting');

  return (
    <Card title={t('imageProvider.title')}>
      <Flexbox gap={24}>
        <ProviderConfig
          id="default"
          name="default"
          proxyUrl={{
            desc: t('imageProvider.default.proxyUrl.desc'),
            placeholder: 'https://api.openai.com/v1',
            title: t('imageProvider.default.proxyUrl.title'),
          }}
          showApiKey={true}
          title={t('imageProvider.default.title')}
        />
        <ModelChecker provider="default" />

        <ProviderConfig
          id="custom"
          name="custom"
          proxyUrl={{
            desc: t('imageProvider.custom.proxyUrl.desc'),
            placeholder: 'https://api.custom-provider.com/v1',
            title: t('imageProvider.custom.proxyUrl.title'),
          }}
          showApiKey={true}
          title={t('imageProvider.custom.title')}
        />
        <ModelChecker provider="custom" />
      </Flexbox>
    </Card>
  );
});

export default ImageProviderSettings; 