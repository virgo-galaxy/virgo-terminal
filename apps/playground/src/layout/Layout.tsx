import { Suspense, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { Layout as VirgoLayout } from '@virgo-design/ui';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import styles from './layout.module.css';

const minGuideWidth = 360;
const minGuideRatio = 0.34;
const minTerminalWidth = 320;
const minTerminalRatio = 0.31;
const resizeStep = 24;

export function Layout({ containerRef, header, guide, guideKey, terminal, terminalStyle }: {
  containerRef: RefObject<HTMLDivElement | null>;
  header: ReactNode;
  guide: ReactNode;
  guideKey: string;
  terminal: ReactNode;
  terminalStyle?: CSSProperties;
}) {
  const { t } = usePlaygroundLocale();
  const [guideRatio, setGuideRatio] = useState(0.5);

  function resizeGuide(divider: HTMLDivElement, width: number) {
    const layout = containerRef.current;
    if (!layout) return;

    const available = layout.clientWidth - divider.offsetWidth;
    const minimum = Math.max(minGuideWidth, available * minGuideRatio);
    const maximum = available - Math.max(minTerminalWidth, available * minTerminalRatio);
    const clamped = Math.min(Math.max(width, minimum), maximum);
    setGuideRatio(clamped / available);
  }

  function moveDivider(event: PointerEvent<HTMLDivElement>) {
    const divider = event.currentTarget;
    const layout = containerRef.current;
    if (!layout || !divider.hasPointerCapture(event.pointerId)) return;

    resizeGuide(divider, event.clientX - layout.getBoundingClientRect().left - divider.offsetWidth / 2);
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    const divider = event.currentTarget;
    const layout = containerRef.current;
    if (!layout) return;

    const currentWidth = divider.getBoundingClientRect().left - layout.getBoundingClientRect().left;
    const widthByKey: Record<string, number> = {
      ArrowLeft: currentWidth - resizeStep,
      ArrowRight: currentWidth + resizeStep,
      Home: minGuideWidth,
      End: layout.clientWidth - divider.offsetWidth - minTerminalWidth,
    };
    const width = widthByKey[event.key];
    if (width === undefined) return;

    event.preventDefault();
    resizeGuide(divider, width);
  }

  return (
    <VirgoLayout className={styles.root!}>
      <VirgoLayout.Header height="var(--vd-sizing-28)" paddingInline={0}>{header}</VirgoLayout.Header>
      <VirgoLayout.Content className={styles.content!}>
        <div
          className={styles.panels}
          data-single-pane={!guide || undefined}
          ref={containerRef}
          style={{
            '--guide-min-width': `${minGuideWidth}px`,
            '--guide-min-ratio': minGuideRatio,
            '--terminal-min-width': `${minTerminalWidth}px`,
            '--terminal-min-ratio': minTerminalRatio,
            '--guide-ratio': guideRatio,
          } as CSSProperties}
        >
          <div className={styles.terminalFrame} style={terminalStyle}>{terminal}</div>
          {guide && (
            <>
              <div
                className={styles.paneDivider}
                role="separator"
                tabIndex={0}
                aria-orientation="vertical"
                aria-label={t('layout.resizeGuide')}
                aria-controls="playground-guide"
                aria-valuemin={minGuideRatio * 100}
                aria-valuemax={100 - minTerminalRatio * 100}
                aria-valuenow={Math.round(guideRatio * 100)}
                onPointerDown={(event) => {
                  if (event.button === 0) event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={moveDivider}
                onKeyDown={resizeWithKeyboard}
              />
              <div className={styles.guideFrame} id="playground-guide" key={guideKey}>
                <Suspense fallback={<p className={styles.guideLoading} role="status">{t('guide.loading')}</p>}>
                  {guide}
                </Suspense>
              </div>
            </>
          )}
        </div>
      </VirgoLayout.Content>
    </VirgoLayout>
  );
}
