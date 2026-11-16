import type { HowlOptions } from 'howler';

import { Howl } from 'howler';

import type { AudioType } from '@types';

import { store } from '@store';

import { getMediaVolume } from '@utils/getMediaVolume';

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
  cancel?: () => void;
};

type ListenOnceOptions = {
  event: string;
  callback: () => void;
  id?: number;
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
  public isFading = false;

  private revision = 0;
  private isDisposed = false;
  private pendingOperations = new Set<() => void>();
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

    const options: HowlerOptions = {
      src,
      format,
      loop,
      volume: getMediaVolume({
        global: global / 100,
        category: categoryVolume / 100,
        relative: relativeVolume / 100,
      }),
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

    this.howlInst.volume(newValue);
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

    for (const cancel of this.pendingOperations) {
      cancel();
    }
  }

  private schedule(duration: number, callbacks: ScheduleCallbacks) {
    const cancel = () => {
      clearTimeout(timer);

      this.pendingOperations.delete(cancel);
      callbacks.cancel?.();
    };

    const timer = setTimeout(() => {
      this.pendingOperations.delete(cancel);
      callbacks.complete();
    }, duration);

    this.pendingOperations.add(cancel);

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

      this.pendingOperations.delete(cancel);
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

    this.pendingOperations.add(cancel);

    this.howlInst.once('load', handleLoad);
    this.howlInst.once('loaderror', handleError);
  }

  private listenOnce(options: ListenOnceOptions) {
    const revision = this.revision;

    const cancel = () => {
      this.howlInst.off(options.event, handleEvent, options.id);
      this.pendingOperations.delete(cancel);
    };

    const handleEvent = () => {
      cancel();

      if (revision === this.revision && !this.isDisposed) {
        options.callback();
      }
    };
    this.pendingOperations.add(cancel);
    this.howlInst.once(options.event, handleEvent, options.id);

    return cancel;
  }

  async play(withFadeIn = false) {
    if (this.isUnloading) {
      return;
    }

    const wasFading = this.isFading;

    if (wasFading) {
      this.cancelPendingOperations();

      if (this.state() === 'loaded') {
        this.howlInst.stop();
      }

      this.isFading = false;
    }

    const revision = this.revision;

    if (withFadeIn && !wasFading) {
      await this.fadeIn();
    }

    if (revision !== this.revision || this.isUnloading) {
      return;
    }

    let hasFailed = false;

    let cancelDeadline = () => {};

    const handleFailure = () => {
      hasFailed = true;
      cancelDeadline();
    };

    const onPlay = this.onPlay;

    const start = () => this.afterLoad(() => {
      if (this.isUnloading) {
        return;
      }

      const id = this.howlInst.play();

      if (typeof id !== 'number') {
        handleFailure();

        return;
      }

      const cancelPlay = this.listenOnce({
        event: 'play',
        id,
        callback: () => {
          cancelError();
          onPlay();
        },
      });
      const cancelError = this.listenOnce({
        event: 'playerror',
        id,
        callback: () => {
          cancelPlay();
          handleFailure();
        },
      });
    }, handleFailure);

    if (this.delay > 0) {
      this.schedule(this.delay, { complete: start });
    } else {
      start();
    }

    if (this.stopBy > 0 && !hasFailed) {
      cancelDeadline = this.schedule(this.stopBy, {
        complete: () => {
          this.cancelPendingOperations();
          this.isFading = false;

          if (this.state() === 'loaded') {
            this.howlInst.stop();
          }
        },
      });
    }
  }

  private async halt(event: 'pause' | 'stop', withFadeOut: boolean) {
    this.cancelPendingOperations();

    const revision = this.revision;

    if (this.isDisposed) {
      return;
    }

    const notFading = withFadeOut && !this.isFading;
    const loaded = !this.isUnloading && this.state() === 'loaded';

    if (notFading && loaded) {
      await this.fadeOut();
    }

    if (revision !== this.revision || this.isDisposed) {
      return;
    }

    this.isFading = false;

    if (this.state() !== 'loaded') {
      return;
    }

    let callback = this.onPause;

    if (event === 'stop') {
      callback = this.onStop;
    }

    this.listenOnce({ event, callback });
    this.howlInst[event]();

    // после остановки возвращаем громкость, иначе воспроизведение начнётся без звука, если withFadeOut = true
    const volume = this.getVolumeByType() / 100;
    this.volume(volume);
  }

  async pause(withFadeOut = false) {
    await this.halt('pause', withFadeOut);
  }

  // не смог добиться быстрой остановки, всё равно ловлю баги. для сегментов лучше использовать без фэйда
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
    if (this.fadeOutWhenUnload && this.state() === 'loaded' && this.playing()) {
      await this.fadeOut();
    }

    this.cancelPendingOperations();

    this.isFading = false;
    this.isDisposed = true;
    this.howlInst.off();

    // Howler.unload() only stops active voices; stop also clears fades on paused voices.
    if (this.state() === 'loaded') {
      this.howlInst.stop();
    }

    this.howlInst.unload();
    this.onUnload();
  }

  // todo: Заменить три параметра на один object
  // eslint-disable-next-line max-params
  fade(from: number, to: number, dur: number) {
    return new Promise<void>((resolve) => {
      this.afterLoad(() => {
        this.schedule(dur, { complete: resolve, cancel: resolve });
        this.howlInst.fade(from, to, HowlWrapper.fadeDurationDefault);
      }, resolve);
    });
  }

  async fadeIn() {
    const revision = this.revision;
    this.isFading = true;

    const globalVolume = this.getVolume().global;

    const volume = (this.getVolumeByType() / 100) * (this.relativeVolume / 100) * (globalVolume / 100);

    await this.fade(0, volume, HowlWrapper.fadeDurationDefault);

    if (revision === this.revision) {
      this.isFading = false;
    }

    return this.howlInst;
  }

  async fadeOut() {
    const revision = this.revision;
    this.isFading = true;

    const globalVolume = this.getVolume().global;

    const volume = (this.getVolumeByType() / 100) * (this.relativeVolume / 100) * (globalVolume / 100);

    await this.fade(volume, 0, HowlWrapper.fadeDurationDefault);

    if (revision === this.revision) {
      this.isFading = false;
    }

    return this.howlInst;
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

        this.pendingOperations.delete(finish);
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

      this.pendingOperations.add(finish);

      for (const eventCur of events) {
        this.howlInst.on(eventCur, checkCompletion);
      }
    });

    return this.completionPromise;
  }
}
