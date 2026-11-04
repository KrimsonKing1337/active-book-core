import { useRef, useState } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { AppMode, Config } from '../../../src/@types';

import { StoreProvider } from '../../../src/store';
import { AppWrapper } from '../../../src/components/AppWrapper';
import { AppModeContext } from '../../../src/components/App/AppModeContext';
import { useStoryGeometry } from '../../../src/components/StoryVisualRoot';
import { Page0 } from '../../../src/pages/Page0';

import { TestControls } from '../TestControls';
import { TestPage } from '../TestPage';

const config: Config = {
  id: 'book-visual-root-browser-test',
  pages: 2,
  defaultTheme: 'dark',
};

const audio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
const query = new URLSearchParams(window.location.search);
const mode: AppMode = query.get('mode') === 'editor' ? 'editor' : 'reader';

export const TestBook = () => {
  const [pages, setPages] = useState(config.pages);
  const currentConfig = { ...config, pages };
  const bookRef = useRef<HTMLDivElement>(null);
  const geometry = useStoryGeometry(bookRef);

  const tools = (
    <>
      <TestControls />

      <button data-testid="grow-book" style={{ position: 'fixed', top: 0, right: 0 }} onClick={() => setPages(5)}>
        Add pages
      </button>

      <output data-testid="geometry" hidden>
        {JSON.stringify(geometry)}
      </output>
    </>
  );

  return (
    <AppModeContext value={mode}>
      <StoreProvider>
        <MemoryRouter>
          <AppWrapper
            ref={bookRef}
            config={currentConfig}
            tableOfContents={[]}
            rangeEffects={[]}
            editorTools={tools}
          >
            <Routes>
              <Route path="/" element={<Page0 header="Audio unlock" audioSrcForInit={audio} showButton={false} />} />
              <Route path="/page-1" element={<TestPage key="one" name="one" />} />
              <Route path="/page-2" element={<TestPage key="two" name="two" />} />
              <Route path="/page-3" element={null} />
            </Routes>
          </AppWrapper>
        </MemoryRouter>
      </StoreProvider>
    </AppModeContext>
  );
};
