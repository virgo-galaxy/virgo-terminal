import Markdown, { type Components } from 'react-markdown';
import type { PlaygroundLocale } from '@/i18n/PlaygroundLocale';
import type { ExampleView } from '../terminal/types';
import enLogs from './content/en-US/simulated-logs.md?raw';
import enTerminal from './content/en-US/terminal.md?raw';
import zhLogs from './content/zh-CN/simulated-logs.md?raw';
import zhTerminal from './content/zh-CN/terminal.md?raw';
import { GuideCodeBlock } from './GuideCodeBlock';
import styles from './guide.module.css';

type GuideView = Exclude<ExampleView, 'shell'>;

const guides = {
  'en-US': { terminal: enTerminal, logs: enLogs },
  'zh-CN': { terminal: zhTerminal, logs: zhLogs },
};
const markdownComponents: Components = { pre: GuideCodeBlock };

export default function Guide({ view, locale }: {
  view: GuideView;
  locale: PlaygroundLocale;
}) {
  return (
    <article className={styles.guide} lang={locale}>
      <Markdown components={markdownComponents}>{guides[locale][view]}</Markdown>
    </article>
  );
}
