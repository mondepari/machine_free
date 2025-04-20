'use client';

import {
    Form, // <-- Import Input
    Radio,
    Select,
    Tooltip,
  } from 'antd';
  import { createStyles } from 'antd-style';
  import { HelpCircle } from 'lucide-react';
  import { memo, useCallback, useEffect } from 'react'; // Убедимся, что memo импортирован
  import { useTranslation } from 'react-i18next';
  import { Flexbox } from 'react-layout-kit';
  
  // {{ Восстанавливаем импорты, указывая на переименованный временный файл }}
  import { useImagineStore, imagineSelectors } from '@/store/imagine';
  
  const useStyles = createStyles(({ css, token }) => ({
    form: css`
      .ant-form-item {
        margin-bottom: 12px;
      }
      .ant-form-item-label > label {
        font-weight: 500;
      }

      /* Style for selected radio buttons */
      .ant-radio-group-solid .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
        /* Keep the default background */
        /* background-color: ${token.colorPrimary};
        border-color: ${token.colorPrimary}; */

        /* Change the text color to black when selected */
        color: '#000000'; // Force black text color

        //* Ensure hover/focus styles don't override the text color */
        &:hover {
          color: '#000000'; // Keep black on hover
        }
        &:focus-within {
          //* Optional: style focus state if needed
          //* box-shadow: 0 0 0 2px ${token.colorPrimaryBg}; */
        }
      }
    `,
    labelTooltip: css`
      margin-inline-start: 4px;
      color: ${token.colorTextDescription};
    `,
  }));
  
  // {{ Восстанавливаем полный компонент }}
  const SettingsPanel = memo(() => {
    const { styles } = useStyles();
    const { t } = useTranslation('common');
    const [form] = Form.useForm();
  
    const settings = useImagineStore(imagineSelectors.selectImagineSettings);
    const updateSettings = useImagineStore((s) => s.updateSettings);
  
    const handleValuesChange = useCallback((changedValues: any, allValues: any) => {
      updateSettings(allValues);
    }, [updateSettings]);
  
    // Initialize form with settings
    useEffect(() => {
      form.setFieldsValue(settings);
    }, [form, settings]);
  
    // Models list
    const modelOptions = [
      { label: 'DALL·E 3', value: 'dall-e-3' },
      { label: 'Flux Pro', value: 'flux-pro' },
      { label: 'Stable Diffusion 3', value: 'stable-diffusion-3' },
    ];
  
    // Style options
    const styleOptions = [
      { label: 'Dynamic', value: 'dynamic' },
      { label: '3D Render', value: '3d_render' },
      { label: 'Anime', value: 'anime' },
      { label: 'Creative', value: 'creative' },
    ];
  
    const imageCountOptions = [1, 2, 3, 4];
  
    const renderLabelWithTooltip = (label: string, tooltip?: string) => (
      <Flexbox align={'center'} horizontal>
        {label}
        {tooltip && (
          <Tooltip title={tooltip}>
            <HelpCircle className={styles.labelTooltip} size={14} />
          </Tooltip>
        )}
      </Flexbox>
    );
  
    // {{ Убедимся, что компонент возвращает JSX }}
    return (
      <Form
        className={styles.form}
        form={form}
        initialValues={settings}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Form.Item label="Model" name="selectedModel">
          <Select options={modelOptions} />
        </Form.Item>
        <Form.Item label="Style" name="style">
          <Select options={styleOptions} />
        </Form.Item>
        <Form.Item label="Image Dimensions" name="aspectRatio">
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="1:1">1:1</Radio.Button>
            <Radio.Button value="2:3">2:3</Radio.Button>
            <Radio.Button value="4:3">4:3</Radio.Button>
            <Radio.Button value="9:16">9:16</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="Resolution" name="resolution">
          <Select
            options={[
              { label: 'Small (512×512)', value: '512x512' },
              { label: 'Medium (1024×1024)', value: '1024x1024' },
              { label: 'Large (1792×1024)', value: '1792x1024' },
            ]}
          />
        </Form.Item>
        <Form.Item label="Number of Images" name="numImages">
          <Radio.Group buttonStyle="solid">
            {imageCountOptions.map((num) => (
              <Radio.Button key={num} value={num}>
                {num}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>
      </Form>
    );
  });
  
  // {{ Убедимся, что экспорт в конце и только один }}
  export default SettingsPanel;