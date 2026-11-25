import { InteractiveTerminal } from './examples/interactive-terminal/InteractiveTerminal';
import { LocalShell } from './examples/local-shell/LocalShell';
import { SimulatedLogs } from './examples/simulated-logs/SimulatedLogs';
import type { DemoTerminalProps, ExampleView } from './examples/types';

export type ShellSession = { attempt: number; shellId: string };

export function Terminal({ view, options, showBackToTop, shellSession, onRestartShell }: {
  view: ExampleView;
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
