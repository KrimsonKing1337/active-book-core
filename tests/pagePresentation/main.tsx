import { StrictMode, use } from 'react';
import { createRoot } from 'react-dom/client';

import type { VisualEffectRegistration } from '@active-book/types';

import { AppWrapper, Audio, DotLottieReact, Img, Video } from '@components';
import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';
import { initialState as defaultConfig } from '@store/config/slice';

import '@active-book/common/styles';
import '../../src/styles/styles.scss';
import './presentation.scss';

localStorage.setItem('presentation-test', JSON.stringify({ config: { ...defaultConfig, welcomeTour: false } }));

let resolvePrimary!: () => void;
const primary = new Promise<void>((resolve) => {
  resolvePrimary = resolve;
});

const timeline: { event: string; visitId?: number; time: number; hidden?: boolean; loader?: boolean }[] = [];

let lastPresented: number | undefined;

store.subscribe(() => {
  const { visit, showLoader } = store.getState().main;

  if (!visit || visit.presentedAt === null || lastPresented === visit.id) {
    return;
  }

  lastPresented = visit.id;
  const story = document.querySelector('[data-story-content]');
  timeline.push({
    event: 'presented',
    visitId: visit.id,
    time: visit.presentedAt,
    hidden: !story || getComputedStyle(story).visibility === 'hidden' || !!story.closest('[inert]'),
    loader: showLoader,
  });
});

const mark = (event: string) => {
  timeline.push({ event, time: performance.now() });
};

const AsyncPrimary = () => {
  use(primary);

  return (
    <>
      <button type="button" onClick={() => mark('interaction')}>Story action</button>
      <Img src="/delayed-page.svg" />
      {new URLSearchParams(location.search).has('dotlottie') && (
        <DotLottieReact src="/broken-animation.json" autoplay eventListeners={[{ event: 'play', handler: () => mark('lottie') }]} />
      )}
      <Video
        id="page-video"
        data-testid="page-video"
        src="/tests/unifiedVisualEffects/movie.webm?presentation"
        loop
        onPlay={() => mark('video')}
      />
      <Audio
        id="page-audio"
        page={1}
        src="/tests/audioLifecycle/tone.wav?presentation"
        playOnLoad
        loop
        fadeOutWhenUnload={false}
        onPlay={() => mark('audio')}
      />
    </>
  );
};

const RenderEffect = () => <div data-testid="animated-effect" className="presentation-animation" />;

const registrations: VisualEffectRegistration[] = [{
  effect: {
    id: 'animated-effect',
    definitionId: 'test.animation',
    params: {},
    placement: { region: 'storyViewport' },
    depth: { plane: 'belowNarrative' },
  },
  lifetime: { type: 'range', range: [{ from: 1, to: 2 }] },
}];

Object.assign(window, {
  presentationTest: {
    read: () => ({ ...store.getState().main, timeline }),
    resolvePrimary,
    navigate: (page: number) => store.dispatch(mainActions.setPage(page)),
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <AppWrapper
        storyPages={[{ id: 'first', content: <AsyncPrimary /> }, { id: 'second', content: <p>Second story</p> }]}
        initialPageId="first"
        config={{ id: 'presentation-test', pages: 2, defaultTheme: 'dark' }}
        tableOfContents={[]}
        registrations={registrations}
        definitions={[{ id: 'test.animation', defaultParams: {}, Renderer: RenderEffect }]}
        editorTools={<button type="button" onClick={() => mark('global')}>Global action</button>}
      />
    </StoreProvider>
  </StrictMode>,
);
