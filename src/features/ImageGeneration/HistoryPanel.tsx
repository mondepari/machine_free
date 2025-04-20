'use client';

import React, { memo } from 'react';

import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { List, Typography, Image, Popconfirm } from 'antd';
import { useTranslation } from 'react-i18next';
import { ActionIcon } from '@lobehub/ui';
import { Trash2 } from 'lucide-react';

import { useImagineStore, imagineSelectors } from '@/store/imagine';
import { ImagineTask } from '@/store/imagine/initialState';

const { Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  actions: css`
    opacity: 0;
    transition: opacity 0.2s;

    .ant-list-item:hover & {
      opacity: 1;
    }
  `,
  container: css`
    padding: 8px;
    height: 100%;
    overflow-y: auto;
  `,
  image: css`
    border-radius: ${token.borderRadiusSM}px;
  `,
  listItem: css`
    cursor: pointer;
    padding: 8px !important;
    border-radius: ${token.borderRadius}px;

    &:hover {
      background-color: ${token.colorBgTextHover};
    }
  `,
}));

const HistoryPanel = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('common'); // Or specific namespace if created

  const history = useImagineStore(imagineSelectors.selectHistory);
  const viewTaskFromHistory = useImagineStore(s => s.viewTaskFromHistory);
  const deleteTask = useImagineStore(s => s.deleteTask);

  const handleItemClick = (task: ImagineTask) => {
    viewTaskFromHistory(task.id);
    console.log('Viewing history item:', task.id);
  };

  const handleDelete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    deleteTask(taskId);
  };

  return (
    <Flexbox className={styles.container} gap={8}>
      <List
        dataSource={history}
        locale={{ emptyText: 'История генераций пуста' /* TODO: Localization */ }}
        renderItem={(item) => (
          <List.Item className={styles.listItem} onClick={() => handleItemClick(item)}>
            <Flexbox align="center" gap={8} horizontal width="100%">
              <Image
                alt={item.prompt.slice(0, 30)} // Shortened prompt as alt
                className={styles.image}
                height={40}
                preview={false} // Disable preview for the small thumb
                src={item.imageUrls?.[0] || ''} // Use optional chaining
                width={40}
                wrapperStyle={{ flexShrink: 0 }}
              />
              <Flexbox flex={1} style={{ overflow: 'hidden' }}>
                <Text ellipsis={{ tooltip: item.prompt }}>
                  {item.prompt}
                </Text>
                <Text style={{ fontSize: 'small' }} type="secondary">
                  {item.status} - {new Date(item.createdAt).toLocaleString()}
                </Text>
              </Flexbox>
              <Popconfirm
                cancelText="No"
                description="Are you sure you want to delete this generation?"
                okText="Yes"
                onClick={(e) => e.stopPropagation()}
                onConfirm={(e) => handleDelete(e as any, item.id)}
                title="Delete this generation?"
              >
                <ActionIcon
                  className={styles.actions}
                  icon={Trash2}
                  size="small"
                />
              </Popconfirm>
            </Flexbox>
          </List.Item>
        )}
      />
    </Flexbox>
  );
});

export default HistoryPanel; 