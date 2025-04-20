'use client';

import { Image } from '@lobehub/ui';
import { Alert, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';
import type { FC } from 'react';

import { useImagineStore, imagineSelectors } from '@/store/imagine';
import { useImageProvider } from '@/hooks/useImageProvider';

const useStyles = createStyles(({ css, token }, { imageCount }: { imageCount?: number }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    align-items: center;
    justify-content: flex-start;
    min-height: 200px;
    padding: 16px;
    background-color: ${token.colorBgLayout};
    border-radius: ${token.borderRadius}px;
    border: 1px dashed ${token.colorBorder};
    position: relative;
    width: 100%;
    overflow: auto;
  `,
  imageCard: css`
    position: relative;
    border-radius: ${token.borderRadius}px;
    overflow: hidden;
    background: ${token.colorBgContainer};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    aspect-ratio: 1;
    height: ${imageCount === 1 ? '600px' : '380px'};
    width: ${imageCount === 1 ? '600px' : '100%'};
  `,
  imageGrid: css`
    display: grid;
    grid-template-columns: ${imageCount === 1 ? '1fr' : 'repeat(2, 1fr)'};
    gap: 16px;
    width: 100%;
    padding: 16px;
    max-width: ${imageCount === 1 ? '900px' : '800px'};
    margin: 0 auto;
    justify-items: center;
  `,
  imageWrapper: css`
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    .ant-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ant-image-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
  placeholder: css`
    color: ${token.colorTextPlaceholder};
    font-size: 14px;
  `,
}));

const ImageDisplay: FC = memo(() => {
  const { t } = useTranslation('imagine');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isGenerating = useImagineStore(imagineSelectors.selectIsGenerating);
  const currentTask = useImagineStore(imagineSelectors.selectCurrentTask);
  const viewedTask = useImagineStore(imagineSelectors.selectViewedTask);
  const { hasActiveProvider } = useImageProvider();

  const displayTask = viewedTask || currentTask;
  const imageUrls = displayTask?.status === 'success' ? displayTask.imageUrls : [];
  const error = displayTask?.status === 'error' ? displayTask.error : undefined;

  const { styles } = useStyles({ imageCount: imageUrls.length });

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [viewedTask?.id, currentTask?.id]);

  const renderContent = () => {
    if (!hasActiveProvider) {
      return (
        <Alert
          description={t('enableProvider')}
          message={t('noProvider')}
          showIcon
          type="warning"
        />
      );
    }

    if (isGenerating && currentTask?.status === 'processing') {
      return (
        <Flexbox align={'center'} gap={8}>
          <Spin size="large" />
          <span className={styles.placeholder}>{t('generating')}</span>
        </Flexbox>
      );
    }

    if (error) {
      return (
        <Alert
          description={error?.message || JSON.stringify(error)}
          message={t('error')}
          showIcon
          type="error"
        />
      );
    }

    if (imageUrls && imageUrls.length > 0) {
      return (
        <div className={styles.imageGrid}>
          {imageUrls.map((url, index) => (
            <div className={styles.imageCard} key={url + index}>
              <div className={styles.imageWrapper}>
                <Image
                  alt={`${displayTask?.prompt || t('generatedImage')} ${index + 1}`}
                  preview={true}
                  src={url}
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={styles.placeholder}>
        {t('imagesWillBeDisplayedHere')}
      </div>
    );
  };

  return <Center className={styles.container}>{renderContent()}</Center>;
});

export default ImageDisplay;