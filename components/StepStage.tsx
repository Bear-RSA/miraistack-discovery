'use client';

/* ============================================================
   STEP STAGE
   Slides one question out and the next one in, direction-aware
   and interruptible. Forward: out to the left, in from the right.
   Back mirrors it, so a step always returns along the path it left.

   The outgoing step is a static DOM clone (pointer-events off) so
   React only ever renders the live step. Its spring starts from the
   live panel's current position *and velocity*, so pressing Next
   twice quickly never snaps or reverses abruptly.
=========================================================== */
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createSpring, type Spring } from '@/lib/spring';

export type Direction = 1 | -1;

export interface StepStageHandle {
  /** Call right before changing the step. Direction 1 = forward, -1 = back. */
  leave(direction: Direction): void;
}

// How far a panel travels, in px. Enough to point the way, not enough to chase.
const OFFSET = 40;
// Critically damped: a step change is a navigation, not a throw.
const SPRING = { response: 0.4, damping: 1 };

export default forwardRef<StepStageHandle, { stepKey: string; children: ReactNode }>(function StepStage({ stepKey, children }, ref) {
  const stage = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const spring = useRef<Spring | null>(null);
  const reduced = useRef<MediaQueryList | null>(null);
  const pending = useRef<Direction | 0>(0);

  // t is -1..1: 0 = in place, ±1 = fully off to one side. Reduced motion drops the slide, keeping the fade.
  function apply(el: HTMLElement, t: number) {
    const offset = reduced.current?.matches ? 0 : OFFSET;
    el.style.transform = `translate3d(${(t * offset).toFixed(2)}px,0,0)`;
    el.style.opacity = Math.max(0, 1 - Math.abs(t)).toFixed(3);
  }

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)');
    const el = panel.current!;
    spring.current = createSpring(0, { ...SPRING, onUpdate: (t) => apply(el, t) });
    return () => spring.current?.stop();
  }, []);

  useImperativeHandle(ref, () => ({
    leave(direction) {
      const el = panel.current;
      const live = spring.current;
      if (!el || !live || !stage.current) return;

      const clone = el.cloneNode(true) as HTMLElement;
      clone.classList.add('exiting');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      stage.current.appendChild(clone);

      // Hand the clone the live panel's position and velocity, then send it off-screen.
      const out = createSpring(live.value, {
        ...SPRING,
        velocity: live.velocity,
        onUpdate: (t) => apply(clone, t),
        onRest: () => clone.remove(),
      });
      out.set(-direction);
      pending.current = direction;
    },
  }));

  // The new step has rendered: start it just off-screen on the incoming side and spring it home.
  useLayoutEffect(() => {
    const s = spring.current;
    const dir = pending.current;
    pending.current = 0;
    if (!s || !dir) return;
    s.snap(dir);
    s.set(0);
  }, [stepKey]);

  return (
    <div className="q-stage" ref={stage}>
      <div className="q-panel" ref={panel}>{children}</div>
    </div>
  );
});
