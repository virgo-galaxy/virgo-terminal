import { Tooltip } from '@virgo-design/ui';
import { useRef, useState, type ReactNode } from 'react';

export function ToolbarTooltip({ label, children }: { label: string; children: ReactNode }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <Tooltip
      ref={anchor}
      anchorRef={anchor}
      open={open}
      onOpenChange={setOpen}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch' && event.currentTarget.contains(event.target as Node)) setOpen(true);
      }}
      onPointerLeave={() => setOpen(false)}
      onFocus={(event) => {
        if (event.currentTarget.contains(event.target) && event.target.matches(':focus-visible')) setOpen(true);
      }}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen(false)}
    >
      {children}
      <Tooltip.Content placement="bottom" size="small" arrow={false}>{label}</Tooltip.Content>
    </Tooltip>
  );
}
