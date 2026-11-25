import type { PlaygroundView } from '../views';
import { InteractiveTerminal } from './samples/interactive-terminal/InteractiveTerminal';
import { LocalShell } from './samples/local-shell/LocalShell';
import { SimulatedLogs } from './samples/simulated-logs/SimulatedLogs';
import type { DemoTerminalProps } from './types';

export type ShellSession = { attempt: number; shellId: string };

export function Terminal({ view, options, showBackToTop, shellSession, onRestartShell }: {
  view: PlaygroundView;
  options: DemoTerminalProps;
  showBackToTop: boolean;
  shellSession: ShellSession | null;
  onRestartShell: () => void;
}) {
  return (
    <>
      {view === 'terminal' && <InteractiveTerminal {...options} />}
      {view === 'logs' && <SimulatedLogs {...options} showBackToTop={showBackToTop} />}
      {import.meta.env.DEV && shellSession && (
        <LocalShell
          key={shellSession.attempt}
          {...options}
          onRestart={onRestartShell}
          shellId={shellSession.shellId}
          visible={view === 'shell'}
        />
      )}
    </>
  );
}
