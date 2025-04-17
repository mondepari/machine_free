'use client';

import { Button } from 'antd';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface ModelCheckerProps {
  provider: string;
}

const ModelChecker = memo<ModelCheckerProps>(({ provider }) => {
  const { t } = useTranslation('common');

  const handleCheckModels = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/models/${provider}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Available models:', data);
    } catch (error) {
      console.error('Error checking models:', error);
    }
  }, [provider]);

  return (
    <Button onClick={handleCheckModels}>
      {t('checkModels')}
    </Button>
  );
});

export default ModelChecker; 