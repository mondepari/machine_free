import { Locales } from '@/locales/resources';

export type * from '@/locales/resources';

export type LocaleMode = Locales | 'auto';

export interface LocaleSettingTranslation {
  imageProvider: {
    apiKey: {
      desc: string;
      placeholder: string;
      title: string;
    };
    checker: {
      desc: string;
      title: string;
    };
    desc: string;
    enabled: string;
    proxyUrl: {
      desc: string;
      placeholder: string;
      title: string;
    };
    title: string;
  };
  tab: {
    about: string;
    agent: string;
    common: string;
    imagine: string;
    llm: string;
    sync: string;
    system: string;
    tts: string;
  };
}
