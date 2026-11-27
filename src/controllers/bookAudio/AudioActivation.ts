import { store } from '@store';

import { registerPageResource } from '@hooks/pagePresentation/registerPageResource';

import { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

import type { AudioDescription } from './descriptions';

import { AudioTimeline } from './AudioTimeline';

type ActivationOptions = {
  description: AudioDescription;
  identity: string;
  isActive: (activation: AudioActivation) => boolean;
  canAutoplay: (activation: AudioActivation) => boolean;
  stop: (activation: AudioActivation) => void;
  remove: (activation: AudioActivation) => void;
};

export class AudioActivation {
  readonly audio: HowlWrapper;
  readonly timeline: AudioTimeline;
  readonly identity: string;
  description: AudioDescription;
  private visitId: number | undefined;
  private cancelPreparation?: () => void;

  constructor(options: ActivationOptions) {
    const { description } = options;

    this.description = description;
    this.identity = options.identity;

    const {
      id,
      src,
      format,
      loop,
      type,
      relativeVolume,
      screamer,
    } = description;

    const formatCopy = [...format];

    this.audio = new HowlWrapper({
      id,
      src: [src],
      format: formatCopy,
      loop,
      type,
      relativeVolume,
      screamer,

      beforePlay: () => this.timeline.beforeManualPlay(),
      canPlay: () => options.isActive(this),
      beforeHalt: () => this.timeline.cancelAutoplay(),
      onUnload: () => options.remove(this),
    });

    const canPlay = () => {
      const isReady = this.audio.loadOutcome === 'ready';
      const canAutoplay = options.canAutoplay(this);

      return isReady && canAutoplay;
    };

    this.timeline = new AudioTimeline({
      audio: this.audio,
      description,
      canPlay,
      stop: () => options.stop(this),
    });
  }

  updateDescription(description: AudioDescription) {
    if (description === this.description) {
      return;
    }

    this.description = description;
    this.setRelativeVolume(description.relativeVolume ?? 100);
  }

  setRelativeVolume(volume: number) {
    if (volume !== this.audio.relativeVolume) {
      this.audio.relativeVolume = volume;

      const categoryVolume = this.audio.getVolumeByType();

      this.audio.volume(categoryVolume / 100);
    }
  }

  prepare(visitId: number) {
    if (this.visitId === visitId) {
      return;
    }

    this.cancelPreparation?.();
    this.cancelPreparation = undefined;
    this.visitId = visitId;

    if (this.audio.loadOutcome === 'ready') {
      return;
    }

    const cancelResource = registerPageResource(store, { visitId, prepare: this.audio.observeLoad });
    const stopObservingLoad = this.audio.observeLoad((outcome) => {
      if (outcome === 'ready') {
        this.timeline.update();
      }
    });

    this.cancelPreparation = () => {
      stopObservingLoad?.();
      cancelResource?.();
    };
  }

  leave() {
    this.cancelPreparation?.();
    this.cancelPreparation = undefined;
    this.visitId = undefined;
    this.timeline.cancelAutoplay();
  }

  dispose() {
    this.timeline.destroy();
    this.leave();
    void this.audio.unload({ immediate: true });
  }
}
