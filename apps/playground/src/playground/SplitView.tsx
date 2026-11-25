import { useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';

const minGuideWidth = 360;
const minGuideRatio = 0.34;
const minTerminalWidth = 320;
const minTerminalRatio = 0.31;
const resizeStep = 24;

export function SplitView({ containerRef, terminal, guide }: {
  containerRef: RefObject<HTMLDivElement | null>;
  terminal: ReactNode;
  guide: ReactNode;
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
    <div
      className="split-view"
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
      {terminal}
      {guide && (
        <>
          <div
            className="pane-divider"
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
          {guide}
        </>
      )}
    </div>
  );
}
