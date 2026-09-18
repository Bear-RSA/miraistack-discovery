/* ============================================================
   SPRING
   A tiny display-synced spring, parameterised the way Apple does
   it: `response` (seconds to reach the target) and `damping`
   (1 = no overshoot, <1 = bounce). Retargeting keeps the current
   value and velocity, so motion can be interrupted or reversed
   mid-flight without a jump.
=========================================================== */

export interface SpringOptions {
  /** Time to (roughly) reach the target, in seconds. Lower = snappier. */
  response?: number;
  /** Damping ratio. 1 = critically damped, 0.8 = slight bounce. */
  damping?: number;
  /** Starting velocity, in value units per second. Hand off a gesture's or an interrupted spring's velocity here. */
  velocity?: number;
  /** Called every frame with the current value. */
  onUpdate: (value: number) => void;
  /** Called once when the spring comes to rest. */
  onRest?: () => void;
}

export interface Spring {
  /** Retarget; carries current value + velocity forward. */
  set(target: number): void;
  /** Jump to a value with no motion. */
  snap(value: number): void;
  stop(): void;
  readonly value: number;
  readonly velocity: number;
  readonly target: number;
}

// Below these thresholds the spring is visually at rest.
const REST_DELTA = 0.005;
const REST_SPEED = 0.05;

export function createSpring(initial: number, opts: SpringOptions): Spring {
  const response = opts.response ?? 0.4;
  const damping = opts.damping ?? 1;
  // Apple's mapping (mass = 1): stiffness and damping coefficient from response + ratio.
  const stiffness = Math.pow((2 * Math.PI) / response, 2);
  const dampingCoeff = (4 * Math.PI * damping) / response;

  let value = initial;
  let velocity = opts.velocity ?? 0;
  let target = initial;
  let raf = 0;
  let last = 0;

  function frame(now: number) {
    // Semi-implicit Euler in fixed sub-steps so a long frame can't blow up.
    const dt = Math.min((now - last) / 1000, 0.064);
    last = now;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const accel = -stiffness * (value - target) - dampingCoeff * velocity;
      velocity += accel * h;
      value += velocity * h;
    }

    const atRest = Math.abs(value - target) < REST_DELTA && Math.abs(velocity) < REST_SPEED;
    if (atRest) {
      value = target;
      velocity = 0;
      raf = 0;
      opts.onUpdate(value);
      opts.onRest?.();
      return;
    }
    opts.onUpdate(value);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  return {
    set(next) {
      target = next;
      if (value === target && velocity === 0) return;
      start();
    },
    snap(next) {
      stop();
      value = target = next;
      velocity = 0;
      opts.onUpdate(value);
    },
    stop,
    get value() { return value; },
    get velocity() { return velocity; },
    get target() { return target; },
  };
}

/** True when the visitor has asked for less motion. Safe on the server. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
