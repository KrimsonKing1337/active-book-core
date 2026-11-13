import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import type { Config } from '../../src/@types';

import { StoreProvider } from '../../src/store';
import { initialState as defaultConfig } from '../../src/store/config/slice';
import { AppWrapper } from '../../src/components/AppWrapper';

import { Content } from './Content';

import '@active-book/common/styles';
import '../../src/styles/styles.scss';

const config: Config = {
  id: 'video-playback-fixture',
  pages: 2,
  defaultTheme: 'dark',
};

localStorage.setItem(config.id, JSON.stringify({ config: { ...defaultConfig, welcomeTour: false } }));
const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing video playback fixture root');
}

const nextPage = <p data-testid="next-page">Next page</p>;
const pages = [{ id: 'video-page', content: <Content /> }, { id: 'next-page', content: nextPage }];

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <AppWrapper
        config={config}
        initialPageId="video-page"
        withoutToolbar
        storyPages={pages}
        tableOfContents={[]}
        rangeEffects={[]}
      >
        <p>Start</p>
      </AppWrapper>
    </StoreProvider>
  </StrictMode>,
);
