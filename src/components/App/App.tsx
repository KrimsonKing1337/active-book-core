import type { PropsWithChildren, ReactNode } from 'react';

import type { AudioEffect } from '@active-book/types';

import type {
  AppMode,
  Config,
  TableOfContents,
} from '@types';

import { StoreProvider } from '@store';

import type { VisualEffects } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import type { StoryPage } from '@components/AppWrapper/@types';

import { AppWrapper } from '@components/AppWrapper';

import { AppModeContext } from './AppModeContext';

export type AppProps = {
  storyPages: readonly StoryPage[];
  appMode?: AppMode;
  config: Config;
  tableOfContents: TableOfContents;
  editorTools?: ReactNode;
  visualSurfaces?: readonly VisualSurfaceItem[];
  visualEffects?: VisualEffects;
  audioDescriptions?: readonly AudioEffect<number>[];
};

export const App = ({
  children,
  storyPages,
  appMode = 'reader',
  config,
  tableOfContents,
  editorTools,
  visualSurfaces,
  visualEffects,
  audioDescriptions,
}: PropsWithChildren<AppProps>) => {
  return (
    <AppModeContext.Provider value={appMode}>
      <StoreProvider>
        <AppWrapper
          storyPages={storyPages}
          config={config}
          tableOfContents={tableOfContents}
          editorTools={editorTools}
          visualSurfaces={visualSurfaces}
          visualEffects={visualEffects}
          audioDescriptions={audioDescriptions}
        >
          {children}
        </AppWrapper>
      </StoreProvider>
    </AppModeContext.Provider>
  );
};
