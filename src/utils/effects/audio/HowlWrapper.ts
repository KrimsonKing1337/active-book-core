import {
  type HowlOptions,
  Howl,
  Howler,
} from 'howler';

import type { AudioType } from '@types';

import { store } from '@store';

import { getMediaVolume } from '@utils/volume/getMediaVolume';

import { AudioFades } from './AudioFades';
import { waitForPlaybackEnd } from './waitForPlaybackEnd';

export type HowlWrapperOptions = {
  id: string;
  page?: number;
  src: HowlOptions['src'];
  format?: HowlOptions['format'];
  loop?: HowlOptions['loop'];
  type?: AudioType;
  relativeVolume?: number;
  screamer?: boolean;
  fadeOutWhenUnload?: boolean;
  delay?: number;
  stopBy?: number;

  beforePlay?: () => void;
  beforeHalt?: () => void;
  canPlay?: () => boolean;
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
  onload: () => void;
  onloaderror: () => void;
};

type AudioLoadOutcome = 'ready' | 'failed' | 'cancelled';
type AudioLoadListener = (outcome: AudioLoadOutcome) => void;

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

type VoiceFadeOptions = Omit<FadeOptions, 'from'> & {
  from?: number;
};

type PendingOperation = {
  cancel: () => void;
};

type UnloadOptions = {
  immediate?: boolean;
};

type PlaybackOptions = {
  withFadeIn: boolean;
  complete: () => void;
  fail: () => void;
  acceptStart?: () => boolean;
  holdUntilStarted?: boolean;
};

type PlaybackRequest = Pick<PlaybackOptions, 'withFadeIn' | 'fail' | 'acceptStart'> & {
  canStart: () => boolean;
};

export class HowlWrapper {
  private static fadeDurationDefault = 1000;

  public readonly howlInst: Howl;
  public id: HowlWrapperOptions['id'];
  public page: HowlWrapperOptions['page'];
  public src: HowlOptions['src'] = '';
  public type: AudioType = 'sfx';
  public relativeVolume: number;
  public fadeOutWhenUnload = true;

  public delay: number = 0;
  public stopBy: number = 0;

  public isUnloading = false;
  private readonly fades: AudioFades;
  private loadResult?: AudioLoadOutcome;
  private readonly loadListeners = new Set<AudioLoadListener>();
  private fadingOut: Promise<boolean> | null = null;
  private haltOperation: object | null = null;
  // Only this Howl's voice IDs are retained; Howler continues to own the sound resources.
  private soundIds = new Set<number>();

  private revision = 0;
  private isDisposed = false;
  private pendingOperations = new Set<PendingOperation>();
  private unloadPromise: Promise<void> | null = null;
  private completion: ReturnType<typeof waitForPlaybackEnd> | null = null;

  private readonly beforePlay: () => void;
  private readonly beforeHalt: () => void;
  private readonly canPlay?: () => boolean;

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
    relativeVolume = 100,
    screamer = false,
    fadeOutWhenUnload = true,
    delay = 0,
    stopBy = 0,
    beforePlay = () => {},
    beforeHalt = () => {},
    canPlay,
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
      onload: this.handleLoad,
      onloaderror: this.handleLoadError,
    };

    // todo: через вебапи делать громкость более 100%
    if (screamer) {
      options.volume = 1;
    }

    this.howlInst = new Howl(options);
    this.fades = new AudioFades(this.howlInst);

    const state = this.howlInst.state();

    if (state === 'loaded') {
      this.handleLoad();
    } else if (state === 'unloaded') {
      this.handleLoadError();
    }

    this.id = id;
    this.page = page;
    this.src = src;
    this.type = type;
    this.relativeVolume = relativeVolume;
    this.fadeOutWhenUnload = fadeOutWhenUnload;
    this.delay = delay;
    this.stopBy = stopBy;

    this.beforePlay = beforePlay;
    this.beforeHalt = beforeHalt;
    this.canPlay = canPlay;
    this.onPlay = onPlay;
    this.onPause = onPause;
    this.onStop = onStop;
    this.onUnload = onUnload;

    this.howlInst.on('end', (soundId) => {
      if (!this.howlInst.loop(soundId) && !this.howlInst.playing(soundId)) {
        this.soundIds.delete(soundId);
        this.fades.removeVoice(soundId, true);
      }
    });

    this.howlInst.on('stop', (soundId) => {
      if (!this.howlInst.playing(soundId)) {
        this.soundIds.delete(soundId);
        this.fades.removeVoice(soundId);
      }
    });

    this.howlInst.on('pause', (soundId) => {
      if (!this.howlInst.playing(soundId)) {
        this.fades.cancel(soundId);
      }
    });
  }

  get loadOutcome() {
    return this.loadResult;
  }

  observeLoad = (listener: AudioLoadListener) => {
    if (this.isDisposed) {
      listener('cancelled');

      return;
    }

    if (this.loadResult) {
      listener(this.loadResult);

      return;
    }

    this.loadListeners.add(listener);

    return () => {
      this.loadListeners.delete(listener);
    };
  };

  private handleLoad = () => this.finishLoad('ready');
  private handleLoadError = () => this.finishLoad('failed');

  private finishLoad(outcome: AudioLoadOutcome) {
    if (this.loadResult) {
      return;
    }

    this.loadResult = outcome;

    this.howlInst.off('load', this.handleLoad);
    this.howlInst.off('loaderror', this.handleLoadError);

    for (const listenerCur of this.loadListeners) {
      this.loadListeners.delete(listenerCur);

      listenerCur(outcome);
    }
  }

  get isFading() {
    return this.fades.isFading;
  }

  // Category volume uses 0..1 here; mixer settings and relative volume remain percentages.
  volume(categoryVolume: number) {
    if (this.isDisposed) {
      return;
    }

    const globalVolume = this.getVolume().global;

    const newValue = getMediaVolume({
      global: globalVolume / 100,
      category: categoryVolume,
      relative: this.relativeVolume / 100,
    });

    this.fades.setVolume(newValue);
  }

  getVolume() {
    return store.getState().volume;
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
    this.fades.cancel();

    for (const operationCur of this.pendingOperations) {
      operationCur.cancel();
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
    if (this.isDisposed || this.loadResult === 'failed' || this.state() === 'unloaded') {
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
    let isActive = true;

    const cancel = () => {
      isActive = false;

      this.howlInst.off(options.event, handleEvent, options.id);
      this.pendingOperations.delete(operation);
    };

    const handleEvent = () => {
      if (!isActive) {
        return;
      }

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

    // Initialize this voice in the same turn as play, leaving other voices untouched.
    let level = 1;

    if (options.withFadeIn || options.holdUntilStarted) {
      level = 0;
    }

    const hasInitialGain = this.fades.addVoice(soundId, level);

    const onPlay = this.onPlay;

    const handlePlay = () => {
      cancelError();

      const isStartAccepted = options.acceptStart?.() ?? true;

      if (!isStartAccepted) {
        this.howlInst.stop(soundId);
        options.complete();

        return;
      }

      if (options.withFadeIn && hasInitialGain()) {
        this.fadeIn(soundId).then(options.complete);
      } else {
        if (options.holdUntilStarted && hasInitialGain()) {
          this.fades.addVoice(soundId, 1);
        }

        options.complete();
      }

      onPlay();
    };

    const cancelPlay = this.listenOnce({
      event: 'play',
      id: soundId,
      callback: handlePlay,
    });

    const handlePlayError = () => {
      cancelPlay();

      this.fades.removeVoice(soundId);
      this.soundIds.delete(soundId);

      options.fail();
    };

    const cancelError = this.listenOnce({
      event: 'playerror',
      id: soundId,
      callback: handlePlayError,
    });

    return () => {
      cancelPlay();
      cancelError();

      this.howlInst.stop(soundId);
      this.soundIds.delete(soundId);
      this.fades.removeVoice(soundId);
    };
  }

  /** Requests one loaded voice. The caller owns the timing and any retry. */
  requestPlayback(options: PlaybackRequest) {
    let isPending = true;
    let cancelVoice: (() => void) | undefined;

    const finish = () => {
      isPending = false;

      this.pendingOperations.delete(operation);
    };

    const fail = () => {
      if (isPending) {
        finish();
        options.fail();
      }
    };

    const cancel = () => {
      if (isPending) {
        finish();
        cancelVoice?.();
      }
    };

    const operation = {
      cancel: () => {
        if (isPending) {
          cancel();
          options.fail();
        }
      },
    };

    this.pendingOperations.add(operation);

    const start = () => {
      if (!isPending) {
        return;
      }

      const canStart = options.canStart();
      const isLoaded = this.state() === 'loaded';

      if (!canStart || !isLoaded || this.isUnloading) {
        fail();

        return;
      }

      const acceptStart = () => {
        finish();

        return options.acceptStart?.() ?? true;
      };

      cancelVoice = this.startPlayback({
        ...options,
        acceptStart,
        fail,
        complete: () => {},
        holdUntilStarted: true,
      });
    };

    const context = Howler.ctx;

    // Resuming separately keeps this request out of Howler's playback queue while autoplay is blocked.
    if (context && context.state !== 'running' && context.state !== 'closed') {
      void context.resume().then(start, fail);
    } else {
      start();
    }

    return cancel;
  }

  async play(withFadeIn = false) {
    if (this.canPlay && !this.canPlay()) {
      return;
    }

    this.beforePlay();

    if (this.isUnloading) {
      return;
    }

    if (this.fadingOut || this.haltOperation) {
      this.fadingOut = null;
      this.haltOperation = null;

      this.cancelPendingOperations();

      if (this.state() === 'loaded') {
        this.fades.reset();
      }
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

      const options: PlaybackOptions = {
        withFadeIn,
        complete,
        fail,
        acceptStart: this.canPlay,
      };

      const start = () => {
        const handleLoad = () => {
          if (this.canPlay && !this.canPlay()) {
            fail();

            return;
          }

          this.startPlayback(options);
        };

        this.afterLoad(handleLoad, fail);
      };

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
              this.completion?.cancel();
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
    this.beforeHalt();
    this.cancelPendingOperations();

    if (this.isDisposed) {
      return;
    }

    const operation = {};
    this.haltOperation = operation;

    const revision = this.revision;
    const loaded = !this.unloadPromise && this.state() === 'loaded';
    const playing = this.playing();

    if (withFadeOut && loaded && playing) {
      const completed = await this.fadeOutVoices();

      if (!completed) {
        if (this.haltOperation === operation) {
          this.haltOperation = null;
        }

        return;
      }
    }

    const revisionsAreNotSame = revision !== this.revision;
    const operationsAreNotSame = this.haltOperation !== operation;

    if (revisionsAreNotSame || this.isDisposed || operationsAreNotSame) {
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
    this.completion?.cancel();

    // A paused voice resumes at its base volume unless the next play requests a fade.
    this.fades.reset();
  }

  async pause(withFadeOut = false) {
    await this.halt('pause', withFadeOut);
  }

  // Без fade остановка непосредственная; withFadeOut завершает голоса после затухания.
  async stop(withFadeOut = false) {
    await this.halt('stop', withFadeOut);
  }

  unload({ immediate = false }: UnloadOptions = {}) {
    if (!this.unloadPromise && !this.isDisposed) {
      this.isUnloading = true;

      this.completion?.cancel();
      this.cancelPendingOperations();

      this.unloadPromise = this.finishUnload(immediate);
    } else if (immediate) {
      this.dispose();
    }

    return this.unloadPromise ?? Promise.resolve();
  }

  private async finishUnload(immediate: boolean) {
    try {
      const shouldFadeOut = !immediate && this.fadeOutWhenUnload;
      const loaded = this.state() === 'loaded';
      const playing = this.playing();

      if (shouldFadeOut && loaded && playing) {
        await this.fadeOutVoices();
      }
    } finally {
      this.dispose();
    }
  }

  private dispose() {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;

    this.completion?.cancel();
    this.fades.clear();
    this.cancelPendingOperations();
    this.soundIds.clear();
    this.howlInst.off();

    // Howler.unload() only stops active voices; stop also clears fades on paused voices.
    if (this.state() === 'loaded') {
      this.howlInst.stop();
    }

    this.howlInst.unload();
    this.finishLoad('cancelled');
    this.onUnload();
  }

  private fadeVoices(options: VoiceFadeOptions, absolute = false) {
    const { soundId } = options;

    let soundIds: Iterable<number> = this.soundIds;

    if (soundId !== undefined) {
      soundIds = [soundId];
    }

    const fades: Promise<boolean>[] = [];

    for (const idCur of soundIds) {
      if (this.howlInst.playing(idCur)) {
        const fadeOptions = {
          ...options,
          soundId: idCur,
        };

        const newFade = this.fades.fade(fadeOptions, absolute);

        fades.push(newFade);
      }
    }

    return fades;
  }

  async fade(options: FadeOptions) {
    if (this.isUnloading || this.state() !== 'loaded') {
      return false;
    }

    const fades = this.fadeVoices(options, true);

    const results = await Promise.all(fades);
    const allFadesCompleted = results.every(Boolean);

    return results.length > 0 && allFadesCompleted;
  }

  async fadeIn(soundId?: number) {
    if (this.isUnloading || this.state() !== 'loaded') {
      return false;
    }

    const fades = this.fadeVoices({
      from: 0,
      to: 1,
      duration: HowlWrapper.fadeDurationDefault,
      soundId,
    });

    const results = await Promise.all(fades);
    const allFadesCompleted = results.every(Boolean);

    return results.length > 0 && allFadesCompleted;
  }

  private fadeOutVoices(duration = HowlWrapper.fadeDurationDefault) {
    const fades = this.fadeVoices({ to: 0, duration });

    const operation = Promise.all(fades).then((results) => {
      if (this.fadingOut === operation) {
        this.fadingOut = null;
      }

      return results.every(Boolean);
    });

    this.fadingOut = operation;

    return operation;
  }

  get isHalting() {
    return this.haltOperation !== null;
  }

  get pendingFadeOut() {
    return this.fadingOut;
  }

  /** A reversible fade. A successful result is independent of terminal unload. */
  fadeOut(duration = HowlWrapper.fadeDurationDefault) {
    if (this.isUnloading || this.state() !== 'loaded') {
      return Promise.resolve(false);
    }

    return this.fadeOutVoices(duration);
  }

  /** Keeps the original fade result and only moves its deadline earlier. */
  shortenFadeOut(duration: number) {
    if (this.isUnloading || !this.fadingOut) {
      return Promise.resolve(false);
    }

    for (const soundIdCur of this.soundIds) {
      this.fades.shortenFadeOut(soundIdCur, duration);
    }

    return this.fadingOut;
  }

  async restoreFadeIn(duration = HowlWrapper.fadeDurationDefault) {
    if (this.isUnloading || this.state() !== 'loaded') {
      return false;
    }

    this.haltOperation = null;
    this.fadingOut = null;

    const results = await Promise.all(this.fadeVoices({ to: 1, duration }));
    const allFadesCompleted = results.every(Boolean);

    return results.length > 0 && allFadesCompleted;
  }

  playing() {
    return this.howlInst.playing();
  }

  hasCurrentPlayback() {
    for (const soundId of this.soundIds) {
      if (this.howlInst.playing(soundId)) {
        return true;
      }
    }

    return false;
  }

  state() {
    return this.howlInst.state();
  }

  waitTillTheEnd() {
    if (this.unloadPromise) {
      return this.unloadPromise;
    }

    this.isUnloading = true;

    if (!this.completion) {
      this.completion = this.finishCurrentPlayback();
    }

    return this.completion.promise;
  }

  /** Finish the current iteration while retaining the option to restore its loop. */
  finishCurrentPlayback() {
    return waitForPlaybackEnd({ howl: this.howlInst, soundIds: this.soundIds });
  }
}
