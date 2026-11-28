import type { Howl } from 'howler';

import {
  type FadeTime,
  type RampOptions,
  FadeRamp,
  clampGain,
} from './FadeRamp';

import {
  cancelHowlerVoiceAutomation,
  getFadeTime,
  setHowlerGroupVolume,
} from './howlerVolume';

type VoiceGain = {
  soundId: number;
  level: number;
  ramp?: FadeRamp;
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
    this.howl.volume(this.outputLevel(level), soundId);

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

      const completed = naturallyEnded && ramp.to === 0;

      ramp.finish(completed);
    }

    this.voices.delete(soundId);
  }

  private outputLevel(level: number) {
    const volume = this.howl.volume();
    const gain = level * volume;

    return clampGain(gain);
  }

  private render(voice: VoiceGain, now: FadeTime) {
    const { soundId, ramp } = voice;

    if (ramp && now.wall >= ramp.deadline) {
      this.finish(soundId, true);

      return;
    }

    cancelHowlerVoiceAutomation(this.howl, soundId);

    if (!ramp) {
      const outputLevel = this.outputLevel(voice.level);

      this.howl.volume(outputLevel, soundId);

      return;
    }

    const from = this.outputLevel(ramp.levelAt(now));
    const to = this.outputLevel(ramp.to);

    const duration = ramp.remainingPlaybackAt(now);

    if (from === to || duration === 0) {
      // In particular, a muted voice still advances along its logical ramp.
      this.howl.volume(from, soundId);
    } else {
      this.howl.fade(from, to, duration, soundId);
    }
  }

  setVolume(volume: number) {
    if (volume === this.howl.volume()) {
      return;
    }

    const now = getFadeTime(this.howl);

    setHowlerGroupVolume(this.howl, volume);

    for (const voiceCur of this.voices.values()) {
      this.render(voiceCur, now);
    }
  }

  reset() {
    const volume = this.howl.volume();

    for (const soundIdCur of this.voices.keys()) {
      cancelHowlerVoiceAutomation(this.howl, soundIdCur);
    }

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

      const now = getFadeTime(this.howl);

      voice.level = ramp.to;

      if (!completed) {
        voice.level = ramp.levelAt(now);
      }

      const outputLevel = this.outputLevel(voice.level);

      cancelHowlerVoiceAutomation(this.howl, soundId);
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

  fade(options: FadeOptions) {
    const {
      soundId,
      from,
      to,
      duration,
    } = options;

    const now = getFadeTime(this.howl);

    const previous = this.voices.get(soundId);

    let level = clampGain(from ?? 1);

    if (previous) {
      if (from === undefined) {
        level = previous.ramp?.levelAt(now) ?? previous.level;
      }

      previous.ramp?.finish(false);
    }

    const voice: VoiceGain = { soundId, level };

    this.voices.set(soundId, voice);

    const target = clampGain(to);

    const durationIsValid = Number.isFinite(duration) && duration > 0;

    if (!durationIsValid || level === target) {
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

    if (!isFadingOut) {
      return;
    }

    if (!Number.isFinite(duration)) {
      return;
    }

    const now = getFadeTime(this.howl);
    const requestedDuration = Math.max(0, duration);

    if (now.wall >= ramp.deadline || ramp.shorten(now, requestedDuration)) {
      this.render(voice, now);
    }
  }
}
