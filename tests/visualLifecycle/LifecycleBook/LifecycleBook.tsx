import { useEffect, useRef, useState } from 'react';

import type { AppMode, Config } from '../../../src/@types';

import { StoreProvider, store } from '../../../src/store';
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
        {isBookVisible && (
          <AppWrapper
            ref={bookRef}
            initialPageId={store.getState().main.pageId}
            config={config}
            storyPages={[
              {
                id: 'page-1',
                content: <TestPage key="one" name="one" />,
              },
              {
                id: 'page-2',
                content: <TestPage key="two" name="two" />,
              },
              {
                id: 'page-3',
                content: null,
              },
              {
                id: 'page-4',
                content: <TestPage key="four" name="four" />,
              },
              {
                id: 'page-5',
                content: <TestPage key="five" name="five" />,
              },
            ]}
            tableOfContents={[]}
            rangeEffects={[]}
            editorTools={tools}
            visualEffects={visualEffects}
          />
        )}
      </StoreProvider>
    </AppModeContext>
  );
};
