import { DefaultResources } from '@/types/locale';
import 'i18next';


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
          apiKey: {
            desc: string;
            label: string;
            placeholder: string;
          };
          desc: string;
          endpoint: {
            desc: string;
            label: string;
            placeholder: string;
          };
          title: string;
        };
      };
    };
  }
}
