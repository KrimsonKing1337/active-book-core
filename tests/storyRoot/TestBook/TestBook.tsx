import { useRef, useState } from 'react';

import type { AppMode, Config } from '../../../src/@types';

import { StoreProvider } from '../../../src/store';
import { AppWrapper } from '../../../src/components/AppWrapper';
import { AppModeContext } from '../../../src/components/App/AppModeContext';
import { useStoryGeometry } from '../../../src/components/StoryRoot';
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

      <button
        data-testid="grow-book"
        style={{
          position: 'fixed', top: 0, right: 0,
        }}
        onClick={() => setPages(5)}
      >
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
        <AppWrapper
          ref={bookRef}
          config={currentConfig}
          storyPages={Array.from({ length: pages }, (_, index) => ({
            id: `page-${index + 1}`,
            content: index < 2 ? <TestPage name={index === 0 ? 'one' : 'two'} /> : null,
          }))}
          tableOfContents={[]}
          rangeEffects={[]}
          editorTools={tools}
        >

          <Page0 header="Audio unlock" audioSrcForInit={audio} showButton={false} />
        </AppWrapper>
      </StoreProvider>
    </AppModeContext>
  );
};
