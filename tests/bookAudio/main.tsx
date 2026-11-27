import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Howler } from 'howler';

import type { AudioEffect } from '@active-book/types';

import { AppWrapper } from '@components';
import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';
import { initialState as defaultConfig } from '@store/config/slice';

import '@active-book/common/styles';
import '../../src/styles/styles.scss';

localStorage.setItem('book-audio', JSON.stringify({ config: { ...defaultConfig, welcomeTour: false } }));

const plays: string[] = [];
const tone = '/tests/audioLifecycle/tone.wav';

const pageSound = (number: number): AudioEffect<number> => {
  const id = `sound-${number}`;

  return {
    id,
    src: tone,
    lifetime: { type: 'page', page: number },
    playOnLoad: true,
    loop: true,
    fadeOut: true,
    relativeVolume: number === 1 ? 100 : 0,

  };
};

const mode = new URLSearchParams(location.search).get('mode');
let audioDescriptions: AudioEffect<number>[] = [
  {
    id: 'range',
    src: tone,
    lifetime: { type: 'range', range: [{ from: 1, to: 2 }] },
    playOnLoad: true,
    loop: true,
    fadeIn: true,
    fadeOut: true,

  },
  {
    id: 'preparing',
    src: `${tone}?preparing`,
    lifetime: { type: 'page', page: 2 },
  },
];

if (mode === 'generations') {
  audioDescriptions = [pageSound(1), pageSound(2), pageSound(3)];
} else if (mode === 'commands') {
  audioDescriptions = [{
    ...audioDescriptions[0],
    delay: 1000,
  }];
} else if (mode === 'wait') {
  audioDescriptions = [{
    ...pageSound(1),
    waitTillTheEnd: true,
  }];
}

const observed = new WeakSet<object>();
store.subscribe(() => {
  const { audioInstances } = store.getState().audioEffects;

  for (const audio of Object.values(audioInstances)) {
    if (audio && !observed.has(audio)) {
      observed.add(audio);
      audio.howlInst.on('play', () => plays.push(audio.id));
    }
  }
});

const root = createRoot(document.getElementById('root')!);
Object.assign(window, {
  audioLifecycle: { howler: Howler },
  bookAudio: {
    close: () => root.unmount(),
    navigate: (page: number) => store.dispatch(mainActions.setPage(page)),
    visit: () => store.getState().main.visit,
    get: (id: string) => store.getState().audioEffects.audioInstances[id],
    plays,
  },
});

root.render(
  <StrictMode>
    <StoreProvider>
      <AppWrapper
        storyPages={['one', 'two', 'three', 'four'].map((id) => ({ id, content: <p>{id}</p> }))}
        initialPageId="one"
        audioDescriptions={audioDescriptions}
        config={{ id: 'book-audio', pages: 4, defaultTheme: 'dark' }}
        tableOfContents={[]}
        editorTools={<button type="button">Enable audio</button>}
      />
    </StoreProvider>
  </StrictMode>,
);
