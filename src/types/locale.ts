import { Locales } from '@/locales/resources';

export type * from '@/locales/resources';

export type LocaleMode = Locales | 'auto';

export interface LocaleSettingTranslation {
  tab: {
    common: string;
    agent: string;
    sync: string;
    llm: string;
    tts: string;
    system: string;
    about: string;
    imagine: string;
  };
  imageProvider: {
    title: string;
    desc: string;
    enabled: string;
    apiKey: {
      title: string;
      desc: string;
      placeholder: string;
    };
    proxyUrl: {
      title: string;
      desc: string;
      placeholder: string;
    };
    checker: {
      title: string;
      desc: string;
    };
  };
}
