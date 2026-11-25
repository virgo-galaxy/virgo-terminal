import Markdown, { type Components } from 'react-markdown';
import type { PlaygroundLocale } from '@/app/i18n/PlaygroundLocale';
import type { ExampleView } from '@/examples/types';
import enLogs from './en-US/simulated-logs.md?raw';
import enTerminal from './en-US/terminal.md?raw';
import zhLogs from './zh-CN/simulated-logs.md?raw';
import zhTerminal from './zh-CN/terminal.md?raw';
import { GuideCodeBlock } from './GuideCodeBlock';
import './guide.css';

type GuideView = Exclude<ExampleView, 'shell'>;

const guides = {
  'en-US': { terminal: enTerminal, logs: enLogs },
  'zh-CN': { terminal: zhTerminal, logs: zhLogs },
};
const markdownComponents: Components = { pre: GuideCodeBlock };

export default function ExampleGuide({ view, locale }: {
  view: GuideView;
  locale: PlaygroundLocale;
}) {
  return (
    <article className="example-guide" lang={locale}>
      <Markdown components={markdownComponents}>{guides[locale][view]}</Markdown>
    </article>
  );
}
