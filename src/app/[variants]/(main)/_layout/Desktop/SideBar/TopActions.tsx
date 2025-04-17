import { ActionIcon } from '@lobehub/ui';
import { Compass, FolderClosed, MessageSquare, Image, Music, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
// ItemType seems problematic, using a simpler type for now
// import type { ItemType } from 'antd/es/menu/hooks/useItems';

import { useGlobalStore } from '@/store/global';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';

export interface TopActionProps {
  isPinned?: boolean | null;
  tab?: SidebarTabKey;
}

// Define a simplified local type for actions
interface ActionItem {
  icon: LucideIcon;
  key: SidebarTabKey;
  label: string;
  onClick: () => void;
}

const TopActions = memo<TopActionProps>(({ tab, isPinned }) => {
  const { t } = useTranslation('common');
  const { showDalle } = useServerConfigStore(featureFlagsSelectors);
  const switchBackToChat = useGlobalStore((s) => s.switchBackToChat);
  const lastAgentId = useSessionStore((s) => s.activeId);
  const router = useRouter();

  return (
    <>
      {/* Chat Button */}
      <Link
        href={'/chat'}
        aria-label={t('tab.chat')}
        passHref
      >
        <ActionIcon
          active={tab === SidebarTabKey.Chat}
          icon={MessageSquare}
          onClick={() => router.push('/chat')} // Or switchBackToChat(lastAgentId)
          placement={'right'}
          size="large"
          title={t('tab.chat')}
        />
      </Link>

      {/* Discover Button */}
      <Link
        href={'/discover'}
        aria-label={t('tab.discover')}
        passHref
      >
        <ActionIcon
          active={tab === SidebarTabKey.Discover}
          icon={Compass}
          onClick={() => router.push('/discover')}
          placement={'right'}
          size="large"
          title={t('tab.discover')}
        />
      </Link>

      {/* Audio Button */}
      <Link
        href={'/audio'}
        aria-label={'Audio Generation'} // Placeholder
        passHref
      >
        <ActionIcon
          active={tab === SidebarTabKey.Audio}
          icon={Music}
          onClick={() => router.push('/audio')}
          placement={'right'}
          size="large"
          title={'Audio Generation'} // Placeholder
        />
      </Link>

      {/* Imagine Button (Conditional) */}
      {showDalle && (
        <Link
          href={'/imagine'}
          aria-label={'Imagine'} // Placeholder
          passHref
        >
          <ActionIcon
            active={tab === SidebarTabKey.Imagine}
            icon={Image}
            onClick={() => router.push('/imagine')}
            placement={'right'}
            size="large"
            title={'Imagine'} // Placeholder
          />
        </Link>
      )}

      {/* Files Button */}
      <Link
        href={'/files'}
        aria-label={'Files'} // Placeholder
        passHref
      >
        <ActionIcon
          active={tab === SidebarTabKey.Files}
          icon={FolderClosed}
          onClick={() => router.push('/files')}
          placement={'right'}
          size="large"
          title={'Files'} // Placeholder
        />
      </Link>
    </>
  );
});

export default TopActions;
