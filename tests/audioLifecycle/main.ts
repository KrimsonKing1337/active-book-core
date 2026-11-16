import type { HowlWrapperOptions } from '../../src/utils/effects/audio/HowlWrapper';

import { Howler } from 'howler';

import { HowlWrapper } from '../../src/utils/effects/audio/HowlWrapper';

const instances = new Map<string, HowlWrapper>();
const events: string[] = [];

const create = (options: Partial<HowlWrapperOptions> = {}) => {
  const id = options.id ?? 'audio';
  const instance = new HowlWrapper({
    id,
    // Test asset: two seconds of 220 Hz mono PCM, 8 kHz / 16 bit.
    src: '/tests/audioLifecycle/tone.wav',
    fadeOutWhenUnload: false,
    ...options,
    onPlay: () => events.push(`play:${id}`),
    onUnload: () => events.push(`unload:${id}`),
  });
  instances.set(id, instance);

  return instance;
};

const get = (id = 'audio') => {
  const instance = instances.get(id);

  if (!instance) {
    throw new Error(`Missing audio: ${id}`);
  }

  return instance;
};

const resourceCount = () => {
  const howls: unknown = Reflect.get(Howler, '_howls');

  if (!Array.isArray(howls)) {
    throw new Error('Howler resource list is unavailable');
  }

  return howls.length;
};

const fixture = {
  create,
  get,
  events,
  resourceCount,
};

declare global {
  interface Window {
    audioLifecycle: typeof fixture;
  }
}

window.audioLifecycle = fixture;
// Create a real AudioContext before requesting its resume from the user gesture.
create();
document.getElementById('unlock')?.addEventListener('click', () => {
  void Howler.ctx.resume();
});
