import type { Howl } from 'howler';

import type { RampOptions } from './FadeRamp';

import { FadeRamp, clampGain } from './FadeRamp';

type AbsoluteVoiceGain = {
  referenceVolume: number;
  multiplier: number;
};

type VoiceGain = {
  soundId: number;
  level: number;
  ramp?: FadeRamp;
  absolute?: AbsoluteVoiceGain;
};

type FadeOptions = {
  soundId: number;
  from?: number;
  to: number;
  duration: number;
};

/** Tracks the intended gain independently of Howler's rounded, timer-driven volume getter. */
export class AudioFades {
  private readonly voices = new Map<number, VoiceGain>();

  constructor(private readonly howl: Howl) {}

  get isFading() {
    const voices = [...this.voices.values()];

    return voices.some((voiceCur) => Boolean(voiceCur.ramp));
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

      const completed = naturallyEnded && !voice.absolute && ramp.to === 0;

      ramp.finish(completed);
    }

    this.voices.delete(soundId);
  }

  private outputLevel(voice: VoiceGain, level: number) {
    const volume = voice.absolute?.multiplier ?? this.howl.volume();
    const gain = level * volume;

    return clampGain(gain);
  }

  private render(voice: VoiceGain, now: number) {
    const { soundId, ramp } = voice;

    if (ramp && now >= ramp.deadline) {
      this.finish(soundId, true);

      return;
    }

    if (!ramp) {
      const outputLevel = this.outputLevel(voice, voice.level);

      this.howl.volume(outputLevel, soundId);

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

    for (const voiceCur of this.voices.values()) {
      if (voiceCur.absolute && voiceCur.ramp) {
        voiceCur.absolute.multiplier = volume / voiceCur.absolute.referenceVolume;
      } else if (voiceCur.absolute) {
        voiceCur.absolute = undefined;
        voiceCur.level = 1;
      }

      this.render(voiceCur, now);
    }
  }

  reset() {
    const volume = this.howl.volume();

    this.clear();
    this.howl.volume(volume);
  }

  clear() {
    this.voices.forEach((voiceCur) => {
      voiceCur.ramp?.finish(false);
    });

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

      const outputLevel = this.outputLevel(voice, voice.level);

      this.howl.volume(outputLevel, soundId);
      ramp.finish(completed);
    }
  }

  cancel(soundId?: number) {
    for (const voiceIdCur of this.voices.keys()) {
      if (soundId === undefined || voiceIdCur === soundId) {
        this.finish(voiceIdCur, false);
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
          const base = this.howl.volume() || 1;
          const outputLevel = this.outputLevel(previous, level);
          const gain = outputLevel / base;

          level = clampGain(gain);
        }
      }

      previous.ramp?.finish(false);
    }

    const voice: VoiceGain = { soundId, level };

    this.voices.set(soundId, voice);

    if (absolute) {
      const volume = this.howl.volume() || 1;

      voice.absolute = { referenceVolume: volume, multiplier: 1 };
    }

    const target = clampGain(to);

    if (!Number.isFinite(duration) || duration <= 0 || level === target) {
      voice.level = target;

      this.render(voice, now);

      return Promise.resolve(true);
    }

    const rampOptions: RampOptions = {
      from: level,
      to: target,
      startedAt: now,
      duration,
    };

    const handleDeadline = () => this.finish(soundId, true);

    const ramp = new FadeRamp(rampOptions, handleDeadline);

    voice.ramp = ramp;

    this.render(voice, now);

    return ramp.completion;
  }

  shortenFadeOut(soundId: number, duration: number) {
    const voice = this.voices.get(soundId);

    if (!voice) {
      return;
    }

    const { ramp } = voice;

    if (!ramp) {
      return;
    }

    const isFadingOut = ramp.to === 0;

    if (!isFadingOut || voice.absolute) {
      return;
    }

    if (!Number.isFinite(duration)) {
      return;
    }

    const now = performance.now();
    const requestedDuration = Math.max(0, duration);
    const deadline = now + requestedDuration;

    if (ramp.shorten(deadline, now)) {
      this.render(voice, now);
    }
  }
}
