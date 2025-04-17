'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import ImageProviderSettings from '@/features/Setting/ImageProviderSettings';
import VideoProviderSettings from '@/features/Setting/VideoProviderSettings';
import PageTitle from '@/components/PageTitle';

const Page = memo(() => {
  const { t } = useTranslation('setting');

  return (
    <>
      <PageTitle title={t('tab.imagine')} />
      <Flexbox gap={24}>
        <ImageProviderSettings />
        <VideoProviderSettings />
      </Flexbox>
    </>
  );
});

export default Page; 