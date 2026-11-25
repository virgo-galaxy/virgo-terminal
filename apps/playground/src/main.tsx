import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { monoFonts } from '@virgo-design/fonts';
import { App } from '@/app/App';
import { defaultFontSize } from '@/playground/toolbar/preferences/preferences';
import '@virgo-design/fonts/sans/inter.css';
import '@virgo-design/fonts/mono/jetbrains-mono.css';
import '@virgo-design/tokens/styles.css';
import '@virgo-design/themes/virgo.css';
import '@virgo-design/ui/styles.css';
import '@virgo-terminal/react/styles.css';
import './style.css';

const root = document.getElementById('root');
if (!root) throw new Error('Playground root element is missing.');

const app = createRoot(root);
void document.fonts.load(`${defaultFontSize}px ${monoFonts.jetbrainsMono.cssFamily}`, 'W')
  .catch(() => [])
  .then((faces) => app.render(
    <StrictMode>
      <App initialFont={faces.length ? 'jetbrains' : 'system'} />
    </StrictMode>,
  ));
