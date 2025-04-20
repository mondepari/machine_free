'use client';

import { Tabs } from 'antd';
import { createStyles } from 'antd-style';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

// Image Generation Components
import HistoryPanel from '@/features/ImageGeneration/HistoryPanel';
import ImageDisplay from '@/features/ImageGeneration/ImageDisplay';
import PromptInput from '@/features/ImageGeneration/PromptInput';
import SettingsPanel from '@/features/ImageGeneration/SettingsPanel';

// Video Generation Components
import {
  VideoPromptInput,
  VideoSettingsPanel,
} from '@/features/VideoGeneration';

const useStyles = createStyles(({ css, token }) => ({
  historyPanel: css`
    width: 280px;
    height: 100%;
    border-inline-start: 1px solid ${token.colorBorderSecondary};
    overflow-y: hidden;
  `,
  imageDisplayContainer: css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    min-height: 200px;
    width: 100%;
  `,
  mainArea: css`
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 16px;
  `,
  promptInputContainer: css`
    width: 100%;
  `,
  settingsPanel: css`
    width: 320px;
    height: 100%;
    border-inline-end: 1px solid ${token.colorBorderSecondary};
    padding: 16px;
    overflow-y: auto;
  `,
  tabsContainer: css`
    padding: 0 16px;
    margin-bottom: 8px;
  `,
}));

const ImaginePage = memo(() => {
  const { styles } = useStyles();
  const [activeTab, setActiveTab] = useState('image');

  const items = [
    {
      key: 'image',
      label: 'Image Generation',
    },
    {
      key: 'video',
      label: 'Video Generation',
    },
  ];

  // Placeholders for Display and History
  const VideoDisplayPlaceholder = () => <div>Video Display Placeholder</div>;
  const VideoHistoryPlaceholder = () => <div>Video History Placeholder</div>;

  return (
    <Flexbox height={'100%'} style={{ flexDirection: 'column' }} width={'100%'}>
      {/* Tabs for switching modes */}
      <Flexbox className={styles.tabsContainer}>
        <Tabs activeKey={activeTab} items={items} onChange={setActiveTab} />
      </Flexbox>

      {/* Main Content Area with 3 Columns */}
      <Flexbox flex={1} height={'calc(100% - 50px)'} horizontal width={'100%'}>
        {/* Левая колонка: Настройки */}
        <Flexbox className={styles.settingsPanel}>
          {activeTab === 'image' ? <SettingsPanel /> : <VideoSettingsPanel />}
        </Flexbox>

        {/* Центральная колонка: Дисплей и Промпт */}
        <Flexbox className={styles.mainArea}>
          <Flexbox className={styles.imageDisplayContainer}>
            {/* Keep using placeholder */}
            {activeTab === 'image' ? <ImageDisplay /> : <VideoDisplayPlaceholder />}
          </Flexbox>
          <Flexbox className={styles.promptInputContainer}>
            {/* Use actual VideoPromptInput */}
            {activeTab === 'image' ? <PromptInput /> : <VideoPromptInput />}
          </Flexbox>
        </Flexbox>

        {/* Правая колонка: История */}
        <Flexbox className={styles.historyPanel}>
          {/* Keep using placeholder */}
          {activeTab === 'image' ? <HistoryPanel /> : <VideoHistoryPlaceholder />}
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

export default ImaginePage;