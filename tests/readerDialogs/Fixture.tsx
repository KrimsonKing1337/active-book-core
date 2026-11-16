import { useState } from 'react';

import type { Config } from '../../src/@types';

import { StoreProvider, store } from '../../src/store';
import { initialState as defaultConfig } from '../../src/store/config/slice';
import { AppWrapper } from '../../src/components/AppWrapper';
import { AppModeContext } from '../../src/components/App/AppModeContext';
import { Page0 } from '../../src/pages/Page0';

import { Content } from './Content';

const audioSource = 'data:audio/wav;base64,'
  + 'UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAA'
  + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  + 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const params = new URLSearchParams(location.search);
const isStart = params.get('start') === 'true';
const config: Config = {
  id: 'reader-dialogs-fixture',
  pages: 2,
  defaultTheme: 'dark',
};

if (!localStorage.getItem(config.id)) {
  localStorage.setItem(config.id, JSON.stringify({
    config: { ...defaultConfig, welcomeTour: params.get('tour') === 'true' },
  }));
}

// Read-only diagnostics: tests activate all opening paths through real controls.
window.readDialogState = () => store.getState();

declare global {
  interface Window {
    readDialogState: () => ReturnType<typeof store.getState>;
  }
}

export const Fixture = () => {
  const [continued, setContinued] = useState(0);
  let mode: 'reader' | 'editor' = 'reader';

  if (params.get('mode') === 'editor') {
    mode = 'editor';
  }

  let initialPageId: string | null = 'page-a';

  if (isStart) {
    initialPageId = null;
  }

  return (
    <AppModeContext value={mode}>
      <StoreProvider>
        <output data-testid="continued">{continued}</output>

        <AppWrapper
          config={config}
          initialPageId={initialPageId}
          storyPages={[
            { id: 'page-a', content: <Content /> },
            { id: 'page-b', content: <p data-testid="second-page">Вторая страница</p> },
          ]}
          tableOfContents={[]}
        >
          <Page0
            header="Тестовая история"
            audioSrcForInit={audioSource}
            goCallback={() => setContinued((count) => count + 1)}
          />
        </AppWrapper>
      </StoreProvider>
    </AppModeContext>
  );
};
