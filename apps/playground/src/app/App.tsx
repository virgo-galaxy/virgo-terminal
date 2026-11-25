import { PlaygroundLocaleProvider } from '@/i18n/PlaygroundLocale';
import { Playground } from '@/playground/Playground';
import type { TerminalPreferenceValues } from '@/playground/preferences/preferences';

export function App({ initialFont }: { initialFont: TerminalPreferenceValues['font'] }) {
  return (
    <PlaygroundLocaleProvider>
      <Playground initialFont={initialFont} />
    </PlaygroundLocaleProvider>
  );
}
