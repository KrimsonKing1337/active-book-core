import { Howler } from 'howler';

import type { HowlWrapperOptions } from '../../src/utils/effects/audio/HowlWrapper';

import { store } from '../../src/store';
import { volumeActions } from '../../src/store/volume';
import { audioEffectsActions } from '../../src/store/effects/audio/audio';

import { HowlWrapper } from '../../src/utils/effects/audio/HowlWrapper';
import { unloadAudio } from '../../src/utils/effects/audio/unloadAudio';

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
  howler: Howler,
  store,
  volumeActions,
  audioEffectsActions,
  cleanup: (id = 'audio') => unloadAudio(get(id)),
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
