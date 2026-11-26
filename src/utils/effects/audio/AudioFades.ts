import type { Howl } from 'howler';

import { clampGain, FadeRamp } from './FadeRamp';

type VoiceGain = {
  soundId: number;
  level: number;
  ramp?: FadeRamp;
  absolute?: {
    referenceVolume: number;
    multiplier: number;
  };
};

type FadeOptions = {
  soundId: number;
  to: number;
  duration: number;
  from?: number;
};

/** Tracks the intended gain independently of Howler's rounded, timer-driven volume getter. */
export class AudioFades {
  private readonly voices = new Map<number, VoiceGain>();

  constructor(private readonly howl: Howl) {}

  get isFading() {
    return [...this.voices.values()].some((voice) => Boolean(voice.ramp));
  }

  addVoice(soundId: number, level: number) {
    this.removeVoice(soundId);
    const voice = { soundId, level };
    this.voices.set(soundId, voice);
    this.howl.volume(this.outputLevel(voice, level), soundId);

    // A later play event may arrive after another command has changed the gain.
    return () => this.voices.get(soundId) === voice;
  }

  removeVoice(soundId: number, naturallyEnded = false) {
    const voice = this.voices.get(soundId);
    const ramp = voice?.ramp;

    if (ramp) {
      if (naturallyEnded) {
        this.howl.volume(0, soundId);
      }

      ramp.finish(naturallyEnded && !voice.absolute && ramp.to === 0);
    }

    this.voices.delete(soundId);
  }

  private outputLevel(voice: VoiceGain, level: number) {
    return clampGain(level * (voice.absolute?.multiplier ?? this.howl.volume()));
  }

  private render(voice: VoiceGain, now: number) {
    const { soundId, ramp } = voice;

    if (ramp && now >= ramp.deadline) {
      this.finish(soundId, true);

      return;
    }

    if (!ramp) {
      this.howl.volume(this.outputLevel(voice, voice.level), soundId);

      return;
    }

    const from = this.outputLevel(voice, ramp.levelAt(now));
    const to = this.outputLevel(voice, ramp.to);

    if (from === to) {
      // In particular, a muted voice still advances along its logical ramp.
      this.howl.volume(from, soundId);
    } else {
      this.howl.fade(from, to, ramp.deadline - now, soundId);
    }
  }

  setVolume(volume: number) {
    const now = performance.now();
    this.howl.volume(volume);

    for (const voice of this.voices.values()) {
      if (voice.absolute && voice.ramp) {
        voice.absolute.multiplier = volume / voice.absolute.referenceVolume;
      } else if (voice.absolute) {
        voice.absolute = undefined;
        voice.level = 1;
      }

      this.render(voice, now);
    }
  }

  reset() {
    this.clear();
    this.howl.volume(this.howl.volume());
  }

  clear() {
    this.voices.forEach((voice) => voice.ramp?.finish(false));
    this.voices.clear();
  }

  private finish(soundId: number, completed: boolean) {
    const voice = this.voices.get(soundId);

    if (voice?.ramp) {
      const { ramp } = voice;
      voice.ramp = undefined;
      const now = performance.now();
      voice.level = ramp.to;

      if (!completed) {
        voice.level = ramp.levelAt(now);
      }

      this.howl.volume(this.outputLevel(voice, voice.level), soundId);
      ramp.finish(completed);
    }
  }

  cancel(soundId?: number) {
    for (const voiceId of this.voices.keys()) {
      if (soundId === undefined || voiceId === soundId) {
        this.finish(voiceId, false);
      }
    }
  }

  fade(options: FadeOptions, absolute = false) {
    const {
      soundId,
      from,
      to,
      duration,
    } = options;
    const now = performance.now();
    const previous = this.voices.get(soundId);
    let level = clampGain(from ?? 1);

    if (previous) {
      if (from === undefined) {
        level = previous.ramp?.levelAt(now) ?? previous.level;

        if (previous.absolute) {
          const base = this.howl.volume();
          level = clampGain(this.outputLevel(previous, level) / (base || 1));
        }
      }

      previous.ramp?.finish(false);
    }

    const voice: VoiceGain = { soundId, level };
    this.voices.set(soundId, voice);

    if (absolute) {
      voice.absolute = { referenceVolume: this.howl.volume() || 1, multiplier: 1 };
    }

    const target = clampGain(to);

    if (!Number.isFinite(duration) || duration <= 0 || level === target) {
      voice.level = target;
      this.render(voice, now);

      return Promise.resolve(true);
    }

    const ramp = new FadeRamp({
      from: level,
      to: target,
      startedAt: now,
      duration,
    }, () => this.finish(soundId, true));
    voice.ramp = ramp;
    this.render(voice, now);

    return ramp.completion;
  }

  shortenFadeOut(soundId: number, duration: number) {
    const voice = this.voices.get(soundId);
    const ramp = voice?.ramp;

    if (ramp && !voice.absolute && ramp.to === 0 && Number.isFinite(duration)) {
      const now = performance.now();

      if (ramp.shorten(now + Math.max(0, duration), now)) {
        this.render(voice, now);
      }
    }
  }
}
