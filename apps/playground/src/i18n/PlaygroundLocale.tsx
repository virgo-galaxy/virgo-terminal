import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { enUS as enUSUi, LocaleProvider, zhCN as zhCNUi } from '@virgo-design/ui/locale';
import { enUS, type MessageKey } from './locales/en-US';
import { zhCN } from './locales/zh-CN';

const messages = { 'en-US': enUS, 'zh-CN': zhCN };
export type PlaygroundLocale = keyof typeof messages;

const PlaygroundLocaleContext = createContext<{
  locale: PlaygroundLocale;
  setLocale: (locale: PlaygroundLocale) => void;
  t: (key: MessageKey) => string;
} | null>(null);

export function PlaygroundLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<PlaygroundLocale>('en-US');

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <PlaygroundLocaleContext.Provider value={{ locale, setLocale, t: (key) => messages[locale][key] }}>
      <LocaleProvider locale={locale === 'zh-CN' ? zhCNUi : enUSUi}>{children}</LocaleProvider>
    </PlaygroundLocaleContext.Provider>
  );
}

export function usePlaygroundLocale() {
  const locale = useContext(PlaygroundLocaleContext);
  if (!locale) throw new Error('PlaygroundLocaleProvider is missing.');
  return locale;
}
