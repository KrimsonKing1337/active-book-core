import type { PropsWithChildren, ReactNode } from 'react';

import type {
  AppMode,
  Config,
  TableOfContents,
} from '@types';

import { StoreProvider } from '@store';

import type { VisualEffects } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import { AppWrapper } from '@components/AppWrapper';
import type { StoryPage } from '@components/AppWrapper/@types';


import { AppModeContext } from './AppModeContext';

export type AppProps = {
  storyPages: readonly StoryPage[];
  appMode?: AppMode;
  config: Config;
  tableOfContents: TableOfContents;
  editorTools?: ReactNode;
  visualSurfaces?: readonly VisualSurfaceItem[];
  visualEffects?: VisualEffects;
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
        >
          {children}
        </AppWrapper>
      </StoreProvider>
    </AppModeContext.Provider>
  );
};
