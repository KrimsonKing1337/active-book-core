import { useEffect, useRef, useState } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { AppMode, Config } from '../../../src/@types';

import { StoreProvider } from '../../../src/store';
import { AppWrapper } from '../../../src/components/AppWrapper';
import { AppModeContext } from '../../../src/components/App/AppModeContext';
import { useStoryGeometry } from '../../../src/components/StoryVisualRoot';

import { TestControls } from '../../storyVisualRoot/TestControls';
import { TestPage } from '../../storyVisualRoot/TestPage';

import { LifecycleControls } from '../LifecycleControls';
import { testApi, visualEffects } from '../testSession';

const config: Config = {
  id: 'visual-lifecycle-test',
  pages: 5,
  defaultTheme: 'dark',
};
const query = new URLSearchParams(window.location.search);
const mode: AppMode = query.get('mode') === 'editor' ? 'editor' : 'reader';

export const LifecycleBook = () => {
  const bookRef = useRef<HTMLDivElement>(null);
  const geometry = useStoryGeometry(bookRef);
  const [isBookVisible, setIsBookVisible] = useState(true);

  useEffect(() => {
    testApi.setBookVisible = setIsBookVisible;
    testApi.ready = true;
  }, []);

  const tools = (
    <>
      <TestControls />
      <LifecycleControls />

      <output data-testid="geometry" hidden>
        {JSON.stringify(geometry)}
      </output>
    </>
  );

  return (
    <AppModeContext value={mode}>
      <StoreProvider>
        <MemoryRouter>
          {isBookVisible && (
            <AppWrapper
              ref={bookRef}
              config={config}
              tableOfContents={[]}
              rangeEffects={[]}
              editorTools={tools}
              visualEffects={visualEffects}
            >
              <Routes>
                <Route path="/" element={null} />
                <Route path="/page-1" element={<TestPage key="one" name="one" />} />
                <Route path="/page-2" element={<TestPage key="two" name="two" />} />
                <Route path="/page-3" element={null} />
                <Route path="/page-4" element={<TestPage key="four" name="four" />} />
                <Route path="/page-5" element={<TestPage key="five" name="five" />} />
              </Routes>
            </AppWrapper>
          )}
        </MemoryRouter>
      </StoreProvider>
    </AppModeContext>
  );
};
