import { DefaultResources } from '@/types/locale';
import 'i18next';

import type { Locales } from '@/locales/resources';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: ['common', 'setting'];
    resources: DefaultResources;
    returnNull: false;
  }

  interface Resources extends DefaultResources {
    setting: {
      settingVideo: {
        provider: {
          title: string;
          desc: string;
          apiKey: {
            label: string;
            placeholder: string;
            desc: string;
          };
          endpoint: {
            label: string;
            placeholder: string;
            desc: string;
          };
        };
      };
    };
  }
}
