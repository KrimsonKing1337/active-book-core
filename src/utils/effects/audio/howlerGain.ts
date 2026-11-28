import { type Howl, Howler } from 'howler';

import {
  getHowlerSounds,
  getHowlerVoiceGain,
  isHowlerSound,
  usesHowlerWebAudio,
} from './howlerVolume';

const disconnectRoute = (source: GainNode, destination: GainNode) => {
  try {
    source.disconnect(destination);

    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'InvalidAccessError') {
      return false;
    }

    throw error;
  }
};

let reportedIncompatibleRoute = false;

/** The only graph hook needed by ActiveBook with Howler 2.2.4. */
export class HowlerGain {
  private multiplier = 1;
  private output?: GainNode;
  private master?: GainNode;
  private routed = new WeakSet<GainNode>();
  private readonly pendingLevels = new Map<number, number>();
  private startingLevel?: number;
  private isUnavailable = false;
  private restoreRefresh?: () => void;

  constructor(private readonly howl: Howl) {
    if (!usesHowlerWebAudio(howl)) {
      return;
    }

    const refresh: unknown = Reflect.get(howl, '_refreshBuffer');

    if (typeof refresh !== 'function') {
      this.isUnavailable = true;

      return;
    }

    const renewBuffer = (sound: unknown) => {
      this.prepareVoice(sound);

      return refresh.call(howl, sound);
    };

    const original = Object.getOwnPropertyDescriptor(howl, '_refreshBuffer');

    if (Reflect.set(howl, '_refreshBuffer', renewBuffer)) {
      this.restoreRefresh = () => {
        if (original) {
          Object.defineProperty(howl, '_refreshBuffer', original);
        } else {
          Reflect.deleteProperty(howl, '_refreshBuffer');
        }
      };
    } else {
      this.isUnavailable = true;
    }
  }

  setMultiplier(multiplier: number) {
    this.multiplier = multiplier;
    this.updateOutput();

    if (this.isUnavailable && multiplier > 1 && !reportedIncompatibleRoute) {
      reportedIncompatibleRoute = true;
      console.warn('ActiveBook audio: incompatible Howler voice route, amplification is limited to 100%.');
    }
  }

  play(level: number) {
    if (!this.restoreRefresh || !usesHowlerWebAudio(this.howl)) {
      return this.howl.play();
    }

    this.startingLevel = level;

    try {
      const id = this.howl.play();
      const isDeferred = this.startingLevel !== undefined && typeof id === 'number';

      if (isDeferred) {
        this.pendingLevels.set(id, level);
      }

      return id;
    } finally {
      this.startingLevel = undefined;
    }
  }

  cancelStart(id: number) {
    this.pendingLevels.delete(id);
  }

  dispose() {
    this.restoreRefresh?.();
    this.restoreRefresh = undefined;
    this.pendingLevels.clear();

    const output = this.output;

    if (output) {
      for (const soundCur of getHowlerSounds(this.howl)) {
        const node = getHowlerVoiceGain(soundCur);

        if (node && this.routed.has(node)) {
          disconnectRoute(node, output);
        }
      }

      output.disconnect();
    }

    this.output = undefined;
    this.master = undefined;
    this.routed = new WeakSet();
  }

  private prepareVoice(sound: unknown) {
    let node: GainNode | undefined;

    if (isHowlerSound(sound)) {
      node = getHowlerVoiceGain(sound);
      const id: unknown = Reflect.get(sound, '_id');

      if (typeof id === 'number') {
        const level = this.startingLevel ?? this.pendingLevels.get(id);
        this.startingLevel = undefined;
        this.pendingLevels.delete(id);

        if (level !== undefined) {
          // _refreshBuffer runs before Howler writes _volume to the voice and starts the source.
          node?.gain.cancelScheduledValues(node.context.currentTime);
          Reflect.set(sound, '_volume', this.howl.volume() * level);
        }
      }
    }

    if (!this.isUnavailable && !this.routeVoice(node)) {
      this.isUnavailable = true;
      this.setMultiplier(this.multiplier);
    }
  }

  private routeVoice(node: GainNode | undefined) {
    const context = Howler.ctx;
    const master = Howler.masterGain;

    const isSharedContext = context
      && context.state !== 'closed'
      && node
      && master instanceof GainNode
      && node.context === context
      && master.context === context;

    if (!isSharedContext) {
      return false;
    }

    if (this.output && this.master !== master) {
      return false;
    }

    if (this.routed.has(node)) {
      return true;
    }

    const output = this.output ?? this.createOutput(master);

    if (!output) {
      return false;
    }

    try {
      node.connect(output);
    } catch (error) {
      if (error instanceof DOMException) {
        return false;
      }

      throw error;
    }

    if (!disconnectRoute(node, master)) {
      disconnectRoute(node, output);

      return false;
    }

    this.routed.add(node);

    return true;
  }

  private createOutput(master: GainNode) {
    const context = master.context;
    let output: GainNode | undefined;

    try {
      output = context.createGain();
      output.gain.setValueAtTime(this.multiplier, context.currentTime);
      output.connect(master);
    } catch (error) {
      output?.disconnect();

      if (error instanceof DOMException) {
        return undefined;
      }

      throw error;
    }

    this.output = output;
    this.master = master;

    return output;
  }

  private updateOutput() {
    if (this.output) {
      let gain = this.multiplier;

      if (this.isUnavailable) {
        gain = 1;
      }

      this.output.gain.setValueAtTime(gain, this.output.context.currentTime);
    }
  }
}
