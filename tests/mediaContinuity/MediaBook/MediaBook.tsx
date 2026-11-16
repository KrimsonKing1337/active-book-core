import type { VisualEffectRegistration } from '@active-book/types';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';

import { AppWrapper } from '@components';
import { AppModeContext } from '@components/App/AppModeContext';

import { CanvasEffect } from '../CanvasEffect';
import { MediaPage } from '../MediaPage';

const registration: VisualEffectRegistration = {
  effect: {
    id: 'css-canvas',
    definitionId: 'test.canvas',
    params: {},
    placement: { region: 'storyViewport' },
    depth: { plane: 'aboveStoryControls' },
  },
  lifetime: { type: 'range', range: [{ from: 1, to: 2 }] },
};
const definitions = [{
  id: 'test.canvas', defaultParams: {}, Renderer: CanvasEffect,
}];
const pages = [{ id: 'first', content: <p>First content</p> }, { id: 'second', content: <MediaPage /> }];

export const MediaBook = () => {
  const mode = new URLSearchParams(location.search).get('mode') === 'editor' ? 'editor' : 'reader';
  const tools = (
    <button data-testid="next" onClick={() => store.dispatch(mainActions.setPage(2))}>
      Next page
    </button>
  );

  return (
    <AppModeContext value={mode}>
      <StoreProvider>
        <AppWrapper
          config={{
            id: 'media-continuity', pages: 2, defaultTheme: 'dark',
          }}
          storyPages={pages}
          initialPageId="first"
          tableOfContents={[]}
          registrations={[registration]}
          definitions={definitions}
          editorTools={tools}
        />
      </StoreProvider>
    </AppModeContext>
  );
};
