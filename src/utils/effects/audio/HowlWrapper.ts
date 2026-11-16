import type { HowlOptions } from 'howler';

import { Howl } from 'howler';

import type { AudioType } from '@types';

import { store } from '@store';

import { getMediaVolume } from '@utils/volume/getMediaVolume';

export type HowlWrapperOptions = {
  id: string;
  page?: number;
  src: HowlOptions['src'];
  format?: HowlOptions['format'];
  loop?: HowlOptions['loop'];
  type?: AudioType;
  playOnLoad?: boolean;
  relativeVolume?: number;
  screamer?: boolean;
  fadeOutWhenUnload?: boolean;
  delay?: number;
  stopBy?: number;

  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onUnload?: () => void;
};

type HowlerOptions = {
  src: HowlOptions['src'];
  format?: HowlOptions['format'];
  loop?: HowlOptions['loop'];
  volume?: HowlOptions['volume'];
};

type ScheduleCallbacks = {
  complete: () => void;
};

type ListenOnceOptions = {
  event: string;
  callback: () => void;
  id?: number;
};

export type FadeOptions = {
  from: number;
  to: number;
  duration: number;
  soundId?: number;
};

type PendingOperation = {
  cancel: () => void;
  isFade?: boolean;
  soundId?: number;
};

type PlaybackOptions = {
  withFadeIn: boolean;
  complete: () => void;
  fail: () => void;
};

export class HowlWrapper {
  private static fadeDurationDefault = 1000;

  public readonly howlInst: Howl;
  public id: HowlWrapperOptions['id'];
  public page: HowlWrapperOptions['page'];
  public src: HowlOptions['src'] = '';
  public type: AudioType = 'sfx';
  public playOnLoad = false;
  public relativeVolume: number;
  public fadeOutWhenUnload = true;

  public delay: number = 0;
  public stopBy: number = 0;

  public isUnloading = false;
  private fadeCount = 0;
  private fadingOut: object | null = null;
  private haltOperation: object | null = null;
  // Only this Howl's voice IDs are retained; Howler continues to own the sound resources.
  private soundIds = new Set<number>();

  private revision = 0;
  private isDisposed = false;
  private pendingOperations = new Set<PendingOperation>();
  private unloadPromise: Promise<void> | null = null;
  private completionPromise: Promise<void> | null = null;

  public onPlay: () => void;
  public onPause: () => void;
  public onStop: () => void;
  public onUnload: () => void;

  constructor({
    id,
    page,
    src,
    format,
    loop,
    type = 'sfx',
    playOnLoad = false,
    relativeVolume = 100,
    screamer = false,
    fadeOutWhenUnload = true,
    delay = 0,
    stopBy = 0,
    onPlay = () => {},
    onUnload = () => {},
    onPause = () => {},
    onStop = () => {},
  }: HowlWrapperOptions) {
    const {
      sfx,
      bg,
      music,
      global,
    } = this.getVolume();

    let categoryVolume = sfx;

    if (type === 'bg') {
      categoryVolume = bg;
    } else if (type === 'music') {
      categoryVolume = music;
    }

    const volume = getMediaVolume({
      global: global / 100,
      category: categoryVolume / 100,
      relative: relativeVolume / 100,
    });

    const options: HowlerOptions = {
      src,
      format,
      loop,
      volume,
    };

    if (screamer) {
      options.volume = 1;
    }

    this.howlInst = new Howl(options);

    this.id = id;
    this.page = page;
    this.src = src;
    this.type = type;
    this.relativeVolume = relativeVolume;
    this.fadeOutWhenUnload = fadeOutWhenUnload;
    this.delay = delay;
    this.stopBy = stopBy;
    this.playOnLoad = playOnLoad;

    this.onPlay = onPlay;
    this.onPause = onPause;
    this.onStop = onStop;
    this.onUnload = onUnload;

    this.howlInst.on('end', (soundId) => {
      if (!this.howlInst.loop(soundId) && !this.howlInst.playing(soundId)) {
        this.soundIds.delete(soundId);
      }
    });
    this.howlInst.on('stop', (soundId) => this.soundIds.delete(soundId));
  }

  get isFading() {
    return this.fadeCount > 0;
  }

  // Category volume uses 0..1 here; mixer settings and relative volume remain percentages.
  volume(categoryVolume: number) {
    if (this.isUnloading || this.isDisposed) {
      return;
    }

    const globalVolume = this.getVolume().global;
    const newValue = getMediaVolume({
      global: globalVolume / 100,
      category: categoryVolume,
      relative: this.relativeVolume / 100,
    });

    this.cancelFades();
    this.fadingOut = null;
    this.haltOperation = null;
    this.howlInst.volume(newValue);
  }

  private readHowlVolume(soundId?: number) {
    if (soundId === undefined) {
      return this.howlInst.volume();
    }

    const volume = this.howlInst.volume(soundId);

    if (typeof volume !== 'number') {
      throw new Error(`Howler did not return a volume for sound ${soundId}`);
    }

    return volume;
  }

  private setHowlVolume(volume: number, soundId?: number) {
    if (soundId === undefined) {
      this.howlInst.volume(volume);
    } else {
      this.howlInst.volume(volume, soundId);
    }
  }

  private cancelFades(soundId?: number) {
    for (const operation of this.pendingOperations) {
      const affectsVoice = soundId === undefined || operation.soundId === undefined || operation.soundId === soundId;

      if (operation.isFade && affectsVoice) {
        operation.cancel();
      }
    }
  }

  getVolume() {
    const storeState = store.getState();

    return storeState.volume;
  }

  getVolumeByType() {
    const volume = this.getVolume();

    let volumeValue = volume.sfx;

    if (this.type === 'bg') {
      volumeValue = volume.bg;
    } else if (this.type === 'music') {
      volumeValue = volume.music;
    }

    return volumeValue;
  }

  private cancelPendingOperations() {
    this.revision += 1;

    for (const operation of this.pendingOperations) {
      operation.cancel();
    }
  }

  private schedule(duration: number, callbacks: ScheduleCallbacks) {
    const cancel = () => {
      clearTimeout(timer);

      this.pendingOperations.delete(operation);
    };

    const timer = setTimeout(() => {
      this.pendingOperations.delete(operation);
      callbacks.complete();
    }, duration);

    const operation = { cancel };
    this.pendingOperations.add(operation);

    return cancel;
  }

  private afterLoad(ready: () => void, cancelled: () => void = () => {}) {
    if (this.isDisposed || this.state() === 'unloaded') {
      cancelled();

      return;
    }

    if (this.state() === 'loaded') {
      ready();

      return;
    }

    const revision = this.revision;

    const detach = () => {
      this.howlInst.off('load', handleLoad);
      this.howlInst.off('loaderror', handleError);

      this.pendingOperations.delete(operation);
    };
    const cancel = () => {
      detach();
      cancelled();
    };
    const handleLoad = () => {
      detach();

      if (revision === this.revision && !this.isDisposed) {
        ready();
      }
    };

    const handleError = () => {
      // A failed resource invalidates all requests waiting for that same load.
      if (revision === this.revision) {
        this.cancelPendingOperations();
      }
    };

    const operation = { cancel };
    this.pendingOperations.add(operation);

    this.howlInst.once('load', handleLoad);
    this.howlInst.once('loaderror', handleError);
  }

  private listenOnce(options: ListenOnceOptions) {
    const revision = this.revision;

    const cancel = () => {
      this.howlInst.off(options.event, handleEvent, options.id);
      this.pendingOperations.delete(operation);
    };

    const handleEvent = () => {
      cancel();

      if (revision === this.revision && !this.isDisposed) {
        options.callback();
      }
    };
    const operation = { cancel };
    this.pendingOperations.add(operation);
    this.howlInst.once(options.event, handleEvent, options.id);

    return cancel;
  }

  private startPlayback(options: PlaybackOptions) {
    if (this.isUnloading) {
      options.complete();

      return;
    }

    const soundId = this.howlInst.play();

    if (typeof soundId !== 'number') {
      options.fail();

      return;
    }

    this.soundIds.add(soundId);

    if (options.withFadeIn) {
      // The per-voice setter runs in the same turn as play; existing voices keep their gain.
      this.howlInst.volume(0, soundId);
    }

    const onPlay = this.onPlay;
    const cancelPlay = this.listenOnce({
      event: 'play',
      id: soundId,
      callback: () => {
        cancelError();

        if (options.withFadeIn) {
          void this.fadeIn(soundId).then(options.complete);
        }

        onPlay();
      },
    });
    const cancelError = this.listenOnce({
      event: 'playerror',
      id: soundId,
      callback: () => {
        cancelPlay();
        this.cancelFades(soundId);
        this.soundIds.delete(soundId);
        options.fail();
      },
    });
  }

  async play(withFadeIn = false) {
    if (this.isUnloading) {
      return;
    }

    if (this.fadingOut || this.haltOperation) {
      this.fadingOut = null;
      this.haltOperation = null;
      this.cancelPendingOperations();
      const targetVolume = this.howlInst.volume();
      this.howlInst.volume(targetVolume);
    }

    return new Promise<void>((resolve) => {
      const complete = () => {
        this.pendingOperations.delete(request);
        resolve();
      };
      const request = { cancel: complete };
      this.pendingOperations.add(request);
      let hasFailed = false;
      let cancelDeadline = () => {};
      const fail = () => {
        hasFailed = true;
        cancelDeadline();
        complete();
      };
      const options = {
        withFadeIn,
        complete,
        fail,
      };
      const start = () => this.afterLoad(() => this.startPlayback(options), fail);

      if (this.delay > 0) {
        this.schedule(this.delay, { complete: start });
      } else {
        start();
      }

      if (this.stopBy > 0 && !hasFailed) {
        cancelDeadline = this.schedule(this.stopBy, {
          complete: () => {
            this.cancelPendingOperations();
            this.fadingOut = null;

            if (this.state() === 'loaded') {
              this.howlInst.stop();
            }
          },
        });
      }

      if (!withFadeIn) {
        complete();
      }
    });
  }

  private async halt(event: 'pause' | 'stop', withFadeOut: boolean) {
    this.cancelPendingOperations();

    if (this.isDisposed) {
      return;
    }

    const revision = this.revision;
    const operation = {};
    this.haltOperation = operation;

    const loaded = !this.isUnloading && this.state() === 'loaded';

    if (withFadeOut && loaded && this.playing()) {
      const completed = await this.fadeOut();

      if (!completed) {
        if (this.haltOperation === operation) {
          this.haltOperation = null;
        }

        return;
      }
    }

    if (revision !== this.revision || this.isDisposed || this.haltOperation !== operation) {
      return;
    }

    this.haltOperation = null;

    if (this.state() !== 'loaded') {
      return;
    }

    let callback = this.onPause;

    if (event === 'stop') {
      callback = this.onStop;
    }

    this.listenOnce({ event, callback });
    this.howlInst[event]();

    // Возвращаем целевую громкость для следующего запуска, включая возобновление после паузы.
    const volume = this.getVolumeByType() / 100;
    this.volume(volume);
  }

  async pause(withFadeOut = false) {
    await this.halt('pause', withFadeOut);
  }

  // Без fade остановка непосредственная; withFadeOut завершает голоса после затухания.
  async stop(withFadeOut = false) {
    await this.halt('stop', withFadeOut);
  }

  unload() {
    if (this.unloadPromise) {
      return this.unloadPromise;
    }

    if (this.isDisposed) {
      return Promise.resolve();
    }

    this.cancelPendingOperations();

    this.isUnloading = true;
    this.unloadPromise = this.finishUnload();

    return this.unloadPromise;
  }

  private async finishUnload() {
    try {
      if (this.fadeOutWhenUnload && this.state() === 'loaded' && this.playing()) {
        await this.fadeOut();
      }
    } finally {
      this.cancelPendingOperations();

      this.isDisposed = true;
      this.soundIds.clear();
      this.howlInst.off();

      // Howler.unload() only stops active voices; stop also clears fades on paused voices.
      if (this.state() === 'loaded') {
        this.howlInst.stop();
      }

      this.howlInst.unload();
      this.onUnload();
    }
  }

  fade({
    from,
    to,
    duration,
    soundId,
  }: FadeOptions) {
    if (this.isDisposed || this.state() !== 'loaded' || !this.howlInst.playing(soundId)) {
      return Promise.resolve(false);
    }

    this.cancelFades(soundId);

    if (duration <= 0 || from === to) {
      this.setHowlVolume(to, soundId);

      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      let active = true;
      const finish = (completed: boolean) => {
        if (!active) {
          return;
        }

        active = false;
        cancelDeadline();
        this.pendingOperations.delete(operation);
        this.howlInst.off('end', checkPlaying, soundId);
        this.howlInst.off('stop', checkPlaying, soundId);
        this.howlInst.off('pause', checkPlaying, soundId);
        this.fadeCount -= 1;

        if (completed) {
          this.setHowlVolume(to, soundId);
        } else if (this.howlInst.playing(soundId)) {
          const currentVolume = this.readHowlVolume(soundId);
          // Howler cancels a fade by jumping to its endpoint; restore the sampled gain afterwards.
          this.setHowlVolume(to, soundId);
          this.setHowlVolume(currentVolume, soundId);
        }

        resolve(completed);
      };
      const checkPlaying = () => {
        if (!this.howlInst.playing(soundId)) {
          finish(false);
        }
      };
      const operation: PendingOperation = {
        cancel: () => finish(false),
        isFade: true,
        soundId,
      };
      const cancelDeadline = this.schedule(duration, { complete: () => finish(true) });
      this.pendingOperations.add(operation);
      this.fadeCount += 1;
      this.howlInst.on('end', checkPlaying, soundId);
      this.howlInst.on('stop', checkPlaying, soundId);
      this.howlInst.on('pause', checkPlaying, soundId);
      this.howlInst.fade(from, to, duration, soundId);
    });
  }

  fadeIn(soundId?: number) {
    const targetVolume = this.howlInst.volume();

    return this.fade({
      from: 0,
      to: targetVolume,
      duration: HowlWrapper.fadeDurationDefault,
      soundId,
    });
  }

  async fadeOut() {
    this.cancelFades();
    const operation = {};
    this.fadingOut = operation;
    const fades: Promise<boolean>[] = [];

    for (const soundId of this.soundIds) {
      if (this.howlInst.playing(soundId)) {
        const currentVolume = this.readHowlVolume(soundId);
        const fade = this.fade({
          from: currentVolume,
          to: 0,
          duration: HowlWrapper.fadeDurationDefault,
          soundId,
        });
        fades.push(fade);
      }
    }

    const results = await Promise.all(fades);

    if (this.fadingOut === operation) {
      this.fadingOut = null;
    }

    return results.every((completed) => completed);
  }

  playing() {
    return this.howlInst.playing();
  }

  state() {
    return this.howlInst.state();
  }

  waitTillTheEnd() {
    if (this.unloadPromise) {
      return this.unloadPromise;
    }

    if (this.completionPromise) {
      return this.completionPromise;
    }

    this.isUnloading = true;
    this.cancelPendingOperations();

    if (this.isDisposed || this.state() !== 'loaded' || !this.playing() || this.howlInst.loop()) {
      return Promise.resolve();
    }

    const duration = this.howlInst.duration();
    const rate = this.howlInst.rate();

    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(rate) || rate <= 0) {
      return Promise.resolve();
    }

    // All current voices started before cleanup. One full clip at the current rate bounds their grace period.
    const deadline = Math.ceil((duration / rate) * 1000);

    const events = [
      'end',
      'pause',
      'stop',
    ];

    this.completionPromise = new Promise<void>((resolve) => {
      let hasFinished = false;

      const finish = () => {
        if (hasFinished) {
          return;
        }

        hasFinished = true;

        this.pendingOperations.delete(operation);
        cancelDeadline();

        for (const event of events) {
          this.howlInst.off(event, checkCompletion);
        }

        resolve();
      };
      const checkCompletion = () => {
        if (!this.playing() || this.howlInst.loop()) {
          finish();
        }
      };
      const cancelDeadline = this.schedule(deadline, { complete: finish });

      const operation = { cancel: finish };
      this.pendingOperations.add(operation);

      for (const eventCur of events) {
        this.howlInst.on(eventCur, checkCompletion);
      }
    });

    return this.completionPromise;
  }
}
