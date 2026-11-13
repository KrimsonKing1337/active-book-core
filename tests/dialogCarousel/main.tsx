import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import type { Config } from '../../src/@types';

import { StoreProvider, store } from '../../src/store';
import { initialState as defaultConfig } from '../../src/store/config/slice';
import { AppWrapper } from '../../src/components/AppWrapper';

import { Content } from './Content';
import { Preview } from './Preview';

import '@active-book/common/styles';
import '../../src/styles/styles.scss';

declare global {
  interface Window {
    presentationSnapshot: () => unknown;
  }
}

window.presentationSnapshot = () => store.getState().windows;
const config: Config = {
  id: 'dialog-carousel-fixture',
  pages: 1,
  defaultTheme: 'dark',
};

localStorage.setItem(config.id, JSON.stringify({ config: { ...defaultConfig, welcomeTour: false } }));
const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing dialog carousel fixture root');
}

let fixture = <Preview />;

if (!new URLSearchParams(location.search).has('preview')) {
  fixture = (
    <StoreProvider>
      <AppWrapper
        config={config}
        initialPageId="presentation-page"
        withoutToolbar
        storyPages={[{ id: 'presentation-page', content: <Content /> }]}
        tableOfContents={[]}
        rangeEffects={[]}
      />
    </StoreProvider>
  );
}

createRoot(root).render(
  <StrictMode>
    {fixture}
  </StrictMode>,
);
