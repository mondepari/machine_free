'use client';

import { ActionIcon } from '@lobehub/ui';
import { Input } from 'antd'; // Добавляем Spin
import { SendHorizonal } from 'lucide-react';
import { memo } from 'react'; // Убираем useState
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

// {{ Импортируем стор и селекторы }}
import { useImagineStore, imagineSelectors } from '@/store/imagine'; // <-- Corrected path and combined imports
// import { imagineSelectors } from '@/store/imagine/selectors'; // <-- Removed redundant import

const { TextArea } = Input;

// Убираем пропсы, так как все берется из стора
// interface PromptInputProps {
//   onSend?: (prompt: string) => void;
//   loading?: boolean;
// }

const PromptInput = memo(() => {
  // {{ Получаем состояние и экшены из стора }}
  const prompt = useImagineStore(imagineSelectors.selectInputPrompt);
  const isGenerating = useImagineStore(imagineSelectors.selectIsGenerating);
  const setInputPrompt = useImagineStore((s) => s.setInputPrompt);
  const generateImage = useImagineStore((s) => s.generateImage);

  const { t } = useTranslation('common'); // Или 'imagine'

  const handleSend = () => {
    if (isGenerating || !prompt) return;
    generateImage(); // Вызываем экшен из стора
  };

  return (
    <Flexbox align={'flex-end'} gap={8} horizontal width={'100%'}>
      <TextArea
        autoSize={{ maxRows: 6, minRows: 2 }}
        disabled={isGenerating} // Отключаем ввод во время генерации
        onChange={(e) => setInputPrompt(e.target.value)} // Обновляем стор
        onPressEnter={(e) => {
          if (!e.shiftKey && !isGenerating) { // Проверяем !isGenerating
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={'Введите промпт для генерации изображения...'} // TODO: Локализация
        style={{ flex: 1 }}
        value={prompt} // Берем значение из стора
      />
      <ActionIcon
        disable={!prompt || isGenerating} // Use disable instead of disabled
        icon={SendHorizonal} // Always provide the Lucide icon
        loading={isGenerating} // Use the loading prop for the spinner
        onClick={handleSend}
        size={'large'}
        title={'Сгенерировать'} // TODO: Локализация
      />
    </Flexbox>
  );
});

export default PromptInput;