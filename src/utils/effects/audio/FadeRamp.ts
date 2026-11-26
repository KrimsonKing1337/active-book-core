export type RampOptions = {
  from: number;
  to: number;
  startedAt: number;
  duration: number;
};

export const clampGain = (level: number) => {
  const cappedLevel = Math.min(1, level);

  return Math.max(0, cappedLevel);
};

export class FadeRamp {
  readonly to: number;
  readonly completion: Promise<boolean>;
  deadline: number;
  private from: number;
  private startedAt: number;
  private timer?: ReturnType<typeof setTimeout>;
  private resolve = (_completed: boolean) => {};

  constructor(options: RampOptions, private readonly onDeadline: () => void) {
    this.from = options.from;
    this.to = options.to;
    this.startedAt = options.startedAt;
    this.deadline = options.startedAt + options.duration;

    this.completion = new Promise((resolve) => {
      this.resolve = resolve;
    });

    this.schedule();
  }

  levelAt(now: number) {
    const elapsed = now - this.startedAt;
    const duration = this.deadline - this.startedAt;
    const gainDelta = this.to - this.from;

    const progress = clampGain(elapsed / duration);

    return this.from + gainDelta * progress;
  }

  private schedule() {
    const deadline = this.deadline;

    const remainingMs = Math.ceil(deadline - performance.now());
    const delay = Math.max(0, remainingMs);

    const timer = setTimeout(() => {
      if (this.timer === timer) {
        this.onDeadline();
      }
    }, delay);

    this.timer = timer;
  }

  shorten(deadline: number, now: number) {
    if (deadline >= this.deadline) {
      return false;
    }

    clearTimeout(this.timer);

    this.from = this.levelAt(now);
    this.startedAt = now;
    this.deadline = deadline;

    this.schedule();

    return true;
  }

  finish(completed: boolean) {
    clearTimeout(this.timer);

    this.timer = undefined;

    this.resolve(completed);
  }
}
