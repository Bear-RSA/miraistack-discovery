'use client';

import { useEffect, useRef } from 'react';
import { createSpring, type Spring } from '@/lib/spring';

// The fill springs to its new width, so a quick Back/Next never makes it jump.
export default function ProgressBar({ value, label }: { value: number; label: string }) {
  const fill = useRef<HTMLDivElement>(null);
  const spring = useRef<Spring | null>(null);

  useEffect(() => {
    const el = fill.current!;
    const s = createSpring(value, { response: 0.5, damping: 1, onUpdate: (v) => { el.style.transform = `scaleX(${v.toFixed(4)})`; } });
    spring.current = s;
    el.style.transform = `scaleX(${value})`;
    return () => s.stop();
    // Only created once; retargeted below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { spring.current?.set(value); }, [value]);

  return (
    <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label={label}>
      <div className="progress-fill" ref={fill} />
    </div>
  );
}
