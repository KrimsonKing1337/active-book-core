import type { Howl } from 'howler';

import { store } from '@store';
import { mainActions } from '@store/main';

import { emit, installHowlerFixture } from '@utils/effects/audio/tests/howlerFixture';

import type { AudioDescription } from '../descriptions';

import { BookAudio } from '../BookAudio';

export const bookKey = 'audio-test';
export let owner: BookAudio;
let fixture: ReturnType<typeof installHowlerFixture>;

export const range = (id: string, options: Partial<AudioDescription> = {}): AudioDescription => ({
  id,
  src: `${id}.wav`,
  lifetime: { type: 'range', range: [{ from: 1, to: 3 }] },
  ...options,
});

export const onPage = (id: string, page: number): AudioDescription => ({
  ...range(id),
  lifetime: { type: 'page', page },
  fadeOut: true,
  loop: true,
});

export const get = (id: string) => {
  const audio = store.getState().audioEffects.audioInstances[id];

  if (!audio) {
    throw new Error(`Audio ${id} is missing`);
  }

  return audio;
};

export const navigate = (page: number) => store.dispatch(mainActions.setPage(page));

export const visit = () => {
  const { visit } = store.getState().main;

  if (!visit) {
    throw new Error('Missing page visit');
  }

  return visit;
};

export const present = () => {
  const { id } = visit();
  store.dispatch(mainActions.setPrimaryCommitted({ visitId: id, committed: true }));
  store.dispatch(mainActions.setShowLoader(false));
  store.dispatch(mainActions.allowPageReveal(id));
  store.dispatch(mainActions.presentPage({ visitId: id, time: performance.now() }));
};

export const advance = (ms: number) => jest.advanceTimersByTimeAsync(ms);

export const trigger = (howl: Howl, event: string) => {
  emit(howl, event);

  return advance(1);
};

beforeEach(() => {
  fixture = installHowlerFixture();

  store.dispatch(mainActions.openBookSession({
    sessionId: bookKey,
    pageIds: [
      'first',
      'second',
      'third',
      'fourth',
      'fifth',
    ],
    initialPage: 'first',
  }));
  store.dispatch(mainActions.setIsAudioUnlocked(true));
  owner = new BookAudio(bookKey);
  owner.start();
});

afterEach(() => {
  owner.close();
  store.dispatch(mainActions.closeBookSession(bookKey));
  fixture.restore();
});
