import { notFound } from 'next/navigation';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';

import { KnowledgeBaseModel } from '@/database/models/knowledgeBase';
import { getServerDBInstance } from '@/database/server/connection';

import Head from './Head';
import Menu from './Menu';

interface Params {
  id: string;
}

const useStyles = createStyles(({ css }) => ({
  container: css`
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 12px;
  `,
}));

type Props = { params: Params };

const MenuPage = async ({ params }: Props) => {
  const { styles } = useStyles();
  const id = params.id;
  const db = await getServerDBInstance();
  const item = await KnowledgeBaseModel.findById(db, params.id);

  if (!item) return notFound();

  return (
    <Flexbox gap={16} height={'100%'} style={{ paddingTop: 12 }}>
      <Head {...item} />
      <Menu id={id} />
    </Flexbox>
  );
};

MenuPage.displayName = 'Menu';

export default MenuPage;
