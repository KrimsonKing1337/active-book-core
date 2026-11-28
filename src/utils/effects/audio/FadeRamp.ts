export type FadeTime = {
  wall: number;
  playback: number;
};

export type RampOptions = {
  from: number;
  to: number;
  startedAt: FadeTime;
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
  private playbackStart: number;
  private playbackDeadline: number;
  private timer?: ReturnType<typeof setTimeout>;
  private resolve = (_completed: boolean) => {};

  constructor(options: RampOptions, private readonly onDeadline: () => void) {
    this.from = options.from;
    this.to = options.to;
    this.playbackStart = options.startedAt.playback;
    this.playbackDeadline = this.playbackStart + options.duration;
    this.deadline = options.startedAt.wall + options.duration;

    this.completion = new Promise((resolve) => {
      this.resolve = resolve;
    });

    this.schedule();
  }

  remainingPlaybackAt(now: FadeTime) {
    return Math.max(0, this.playbackDeadline - now.playback);
  }

  levelAt(now: FadeTime) {
    if (now.playback >= this.playbackDeadline) {
      return this.to;
    }

    const elapsed = now.playback - this.playbackStart;
    const duration = this.playbackDeadline - this.playbackStart;
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

  shorten(now: FadeTime, duration: number) {
    const deadline = now.wall + duration;

    if (deadline >= this.deadline) {
      return false;
    }

    clearTimeout(this.timer);

    this.from = this.levelAt(now);
    this.playbackStart = now.playback;
    this.playbackDeadline = Math.min(this.playbackDeadline, now.playback + duration);
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
