import type { ExampleView } from './terminal/types';

export type PlaygroundView = ExampleView | 'connect-device';

export const showLocalShellDemo = import.meta.env.DEV && import.meta.env.VITE_SHOW_LOCAL_SHELL_DEMO === '1';
