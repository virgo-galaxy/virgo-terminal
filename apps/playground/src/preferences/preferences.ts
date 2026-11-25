import { monoFonts } from '@virgo-design/fonts';
import type { TerminalAppearance, TerminalScrollbar } from '@virgo-terminal/react';

export const fonts = {
  jetbrains: { label: monoFonts.jetbrainsMono.name, family: `${monoFonts.jetbrainsMono.cssFamily}, monospace` },
  system: { label: null, family: 'monospace' },
  console: { label: 'Monaco / Consolas', family: 'Monaco, Consolas, monospace' },
  courier: { label: 'Courier New', family: '"Courier New", monospace' },
};

export const defaultFontSize = 15;
export const sizes = [12, 14, 15, 16, 18, 20, 24];
export const scrollbarWidths = [4, 6, 8, 10, 12, 14];
export const scrollbarRadii = [0, 2, 3, 5, 7];
export const historyLimits = [0, 500, 1000, 5000, 10000];
type ScrollbarVisibility = NonNullable<TerminalScrollbar['visibility']>;

export const themes = {
  classic: { colors: { background: '#000000', foreground: '#ffffff' } },
  paper: {
    colors: {
      background: '#f4f1e8', foreground: '#252627', cursor: '#252627', cursorAccent: '#f4f1e8',
      selectionBackground: '#c4d3e2',
      black: '#252627', red: '#9b2d35', green: '#176345', yellow: '#805000', blue: '#344e93',
      magenta: '#783c87', cyan: '#17616a', white: '#504e49',
      brightBlack: '#555550', brightRed: '#9e2834', brightGreen: '#176345', brightYellow: '#805000',
      brightBlue: '#344e93', brightMagenta: '#783c87', brightCyan: '#17616a', brightWhite: '#252627',
    },
  },
} satisfies Record<string, { colors: NonNullable<TerminalAppearance['theme']> }>;

export type TerminalPreferenceValues = {
  font: keyof typeof fonts;
  fontSize: string;
  theme: keyof typeof themes;
  scrollbarVisibility: ScrollbarVisibility;
  scrollbarWidth: string;
  scrollbarRadius: string;
  history: string;
  copyOnSelect: boolean;
  showBackToTop: boolean;
  shellId: string;
};

export const defaultPreferences: Omit<TerminalPreferenceValues, 'font'> = {
  fontSize: String(defaultFontSize),
  theme: 'classic',
  scrollbarVisibility: 'auto',
  scrollbarWidth: '6',
  scrollbarRadius: '3',
  history: '1000',
  copyOnSelect: false,
  showBackToTop: false,
  shellId: 'system',
};
