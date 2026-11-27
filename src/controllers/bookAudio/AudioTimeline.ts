import type { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

import type { AudioDescription } from './descriptions';

type TimelineOptions = {
  audio: HowlWrapper;
  description: AudioDescription;
  canPlay: () => boolean;
  stop: () => void;
};

type PlaybackAttempt = {
  cancel?: () => void;
};

const MAX_TIMER_DELAY = 2 ** 31 - 1;

export class AudioTimeline {
  private startedAt: number | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private attempt: PlaybackAttempt | null = null;
  private isAutoplayPending: boolean;
  private hasStoppedAutomatically = false;
  private unlockCount = 0;
  private lastAttemptUnlockCount = -1;

  constructor(private readonly options: TimelineOptions) {
    this.isAutoplayPending = options.description.playOnLoad ?? false;

    options.audio.howlInst.on('unlock', this.handleUnlock);
  }

  private handleUnlock = () => {
    this.unlockCount += 1;
    this.update();
  };

  present(time: number) {
    this.startedAt ??= time;
  }

  get hasReachedStop() {
    const { stopBy = 0 } = this.options.description;

    if (this.startedAt === null || stopBy <= 0) {
      return false;
    }

    return performance.now() >= this.startedAt + stopBy;
  }

  cancelAutoplay() {
    this.isAutoplayPending = false;
    const attempt = this.attempt;

    this.attempt = null;
    attempt?.cancel?.();
  }

  beforeManualPlay() {
    this.stopIfDue();
    this.cancelAutoplay();
  }

  private stopIfDue() {
    if (this.hasStoppedAutomatically || !this.hasReachedStop) {
      return;
    }

    this.hasStoppedAutomatically = true;
    this.cancelAutoplay();
    this.options.stop();
  }

  update() {
    clearTimeout(this.timer);

    this.stopIfDue();

    const startedAt = this.startedAt;

    if (startedAt === null) {
      return;
    }

    const { delay = 0, stopBy = 0 } = this.options.description;

    let nextDeadline = Infinity;

    if (!this.hasStoppedAutomatically && stopBy > 0) {
      nextDeadline = startedAt + stopBy;
    }

    const startAt = startedAt + delay;
    const now = performance.now();

    if (this.isAutoplayPending && startAt < nextDeadline) {
      if (now < startAt) {
        nextDeadline = startAt;
      } else {
        this.tryAutoplay();
      }
    }

    if (Number.isFinite(nextDeadline)) {
      const remaining = nextDeadline - performance.now();
      const timerDelay = Math.min(MAX_TIMER_DELAY, Math.max(0, remaining));

      this.timer = setTimeout(() => {
        this.update();
      }, timerDelay);
    }
  }

  private tryAutoplay() {
    if (this.attempt || this.lastAttemptUnlockCount === this.unlockCount) {
      return;
    }

    if (!this.options.canPlay()) {
      return;
    }

    const { audio, description } = this.options;

    if (audio.playing()) {
      this.cancelAutoplay();

      return;
    }

    const attempt: PlaybackAttempt = {};

    this.attempt = attempt;
    this.lastAttemptUnlockCount = this.unlockCount;

    attempt.cancel = audio.requestPlayback({
      withFadeIn: description.fadeIn ?? false,

      canStart: () => {
        if (this.attempt !== attempt) {
          return false;
        }

        const canStillPlay = this.options.canPlay();

        return canStillPlay && !this.hasReachedStop;
      },

      fail: () => {
        if (this.attempt !== attempt) {
          return;
        }

        this.attempt = null;

        if (this.lastAttemptUnlockCount !== this.unlockCount) {
          this.update();
        }
      },

      acceptStart: () => {
        if (this.attempt !== attempt) {
          return false;
        }

        this.attempt = null;
        this.isAutoplayPending = false;

        const canStillPlay = this.options.canPlay();

        return canStillPlay && !this.hasReachedStop;
      },
    });
  }

  destroy() {
    this.cancelAutoplay();
    this.startedAt = null;

    clearTimeout(this.timer);

    this.options.audio.howlInst.off('unlock', this.handleUnlock);
  }
}
