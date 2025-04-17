import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import { ProfileTabs, SettingsTabs, SidebarTabKey } from '@/store/global/initialState';

/**
 * Returns the active tab key based on the pathname.
 */
export const useActiveTabKey = () => {
  const pathname = usePathname();

  const key = useMemo(() => {
    if (pathname.startsWith('/chat')) return SidebarTabKey.Chat;
    if (pathname.startsWith('/discover')) return SidebarTabKey.Discover;
    if (pathname.startsWith('/me')) return SidebarTabKey.Me;
    if (pathname.startsWith('/files')) return SidebarTabKey.Files;
    if (pathname.startsWith('/imagine')) return SidebarTabKey.Imagine;
    if (pathname.startsWith('/audio')) return SidebarTabKey.Audio;

    return SidebarTabKey.Chat;
  }, [pathname]);

  return key;
};

/**
 * Returns the active setting page key (common/sync/agent/...)
 */
export const useActiveSettingsKey = () => {
  const pathname = usePathname();

  const tabs = pathname.split('/').at(-1);

  if (tabs === 'settings') return SettingsTabs.Common;

  return tabs as SettingsTabs;
};

/**
 * Returns the active profile page key (profile/security/stats/...)
 */
export const useActiveProfileKey = () => {
  const pathname = usePathname();

  const tabs = pathname.split('/').at(-1);

  if (tabs === 'profile') return ProfileTabs.Profile;

  return tabs as ProfileTabs;
};
