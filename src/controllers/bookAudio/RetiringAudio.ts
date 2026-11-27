import type { AudioActivation } from './AudioActivation';

type Retirement = {
  generation?: number;
  waiting?: ReturnType<AudioActivation['audio']['finishCurrentPlayback']>;
};

const SHORT_FADE_MS = 100;

export class RetiringAudio {
  private readonly retiring = new Map<AudioActivation, Retirement>();
  private generation = 0;

  constructor(private readonly dispose: (activation: AudioActivation) => void) {}

  get activations() {
    return this.retiring.keys();
  }

  track(activation: AudioActivation) {
    this.retiring.set(activation, {});
  }

  waitForEnd(activation: AudioActivation) {
    const waiting = activation.audio.finishCurrentPlayback();

    const retirement = { waiting };
    this.retiring.set(activation, retirement);

    void waiting.promise.then(() => {
      this.finish(activation, retirement);
    });
  }

  fadeOut(activations: readonly AudioActivation[]) {
    const pending = activations.filter((activation) => this.has(activation));

    if (!pending.length) {
      return;
    }

    this.generation += 1;
    const nextGeneration = this.generation;

    for (const [activationCur, retirementCur] of this.retiring) {
      const { generation } = retirementCur;

      if (generation === undefined) {
        continue;
      }

      if (generation < nextGeneration - 1) {
        this.dispose(activationCur);
      } else if (!activationCur.audio.isHalting) {
        void activationCur.audio.shortenFadeOut(SHORT_FADE_MS);
      }
    }

    for (const activationCur of pending) {
      if (!this.has(activationCur)) {
        continue;
      }

      this.remove(activationCur);

      const retirement = { generation: nextGeneration };
      this.retiring.set(activationCur, retirement);

      const { audio } = activationCur;

      const fade = audio.pendingFadeOut ?? audio.fadeOut();

      void fade.then(() => {
        this.finish(activationCur, retirement);
      });
    }
  }

  private finish(activation: AudioActivation, retirement: Retirement) {
    const currentRetirement = this.retiring.get(activation);

    if (currentRetirement === retirement) {
      this.dispose(activation);
    }
  }

  restore(activation: AudioActivation) {
    const retirement = this.retiring.get(activation);

    const { audio, timeline } = activation;

    if (!retirement || audio.isUnloading || timeline.hasReachedStop) {
      return false;
    }

    if (!audio.hasCurrentPlayback()) {
      this.dispose(activation);

      return false;
    }

    if (retirement.waiting) {
      const restored = retirement.waiting.restore();

      if (!restored) {
        this.dispose(activation);

        return false;
      }
    } else if (!audio.isHalting) {
      void audio.restoreFadeIn();
    }

    this.retiring.delete(activation);

    return true;
  }

  has(activation: AudioActivation) {
    return this.retiring.has(activation);
  }

  isFading(activation: AudioActivation) {
    const retirement = this.retiring.get(activation);

    return retirement?.generation !== undefined;
  }

  remove(activation: AudioActivation) {
    const retirement = this.retiring.get(activation);

    this.retiring.delete(activation);
    retirement?.waiting?.cancel();
  }
}
