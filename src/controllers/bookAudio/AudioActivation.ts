import { store } from '@store';

import { registerPageResource } from '@hooks/pagePresentation/registerPageResource';

import { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

import type { AudioDescription } from './descriptions';

import { AudioResource } from './AudioResource';
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
  private readonly resource: AudioResource;
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

    this.audio = new HowlWrapper({
      id,
      src: [src],
      format,
      loop,
      type,
      relativeVolume,
      screamer,

      beforePlay: () => this.timeline.beforeManualPlay(),
      canPlay: () => options.isActive(this),
      onPlay: () => this.description.onPlay?.(),
      onPause: () => this.description.onPause?.(),
      onStop: () => this.description.onStop?.(),
      onUnload: () => {
        options.remove(this);
        this.description.onUnload?.();
      },
    });

    this.resource = new AudioResource(this.audio, () => this.timeline.update());
    this.timeline = new AudioTimeline({
      audio: this.audio,
      description,
      canPlay: () => {
        const isReady = this.resource.isReady;
        const canAutoplay = options.canAutoplay(this);

        return isReady && canAutoplay;
      },
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
    this.visitId = visitId;

    if (!this.resource.isReady) {
      const prepare = this.resource.prepare;
      this.cancelPreparation = registerPageResource(store, { visitId, prepare });
    }
  }

  leave() {
    this.cancelPreparation?.();
    this.cancelPreparation = undefined;
    this.visitId = undefined;
    this.timeline.cancelAutoplay();
  }

  dispose() {
    this.timeline.destroy();
    this.resource.destroy();
    this.leave();
    void this.audio.unload({ immediate: true });
  }
}
