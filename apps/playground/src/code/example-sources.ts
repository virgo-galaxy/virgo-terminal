import interactiveTerminalSource from '@/examples/interactive-terminal/InteractiveTerminal.tsx?raw';
import simulatedLogsSource from '@/examples/simulated-logs/SimulatedLogs.tsx?raw';
import localShellSource from '@/examples/local-shell/LocalShell.tsx?raw';
import localShellServerSource from '../../server/local-shell-plugin.ts?raw';

export const exampleFiles = {
  terminal: { name: 'InteractiveTerminal.tsx', source: interactiveTerminalSource },
  logs: { name: 'SimulatedLogs.tsx', source: simulatedLogsSource },
};

export const shellFiles = {
  client: { name: 'LocalShell.tsx', source: localShellSource },
  server: { name: 'local-shell-plugin.ts', source: localShellServerSource },
};
