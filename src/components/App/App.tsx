import type { PropsWithChildren, ReactNode } from 'react';

import { Suspense } from 'react';

import { MemoryRouter } from 'react-router-dom';

import type { AppMode, RangeEffects, Config, TableOfContents } from '@types';

import { StoreProvider } from '@store';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import { AppWrapper } from '@components/AppWrapper';

import type { VisualEffects } from '../../controllers/visualEffects';

import { AppModeContext } from './AppModeContext';
import { Routes } from './Routes';

export type AppProps = {
  appMode?: AppMode;
  config: Config;
  tableOfContents: TableOfContents;
  rangeEffects: RangeEffects;
  editorTools?: ReactNode;
  visualSurfaces?: readonly VisualSurfaceItem[];
  visualEffects?: VisualEffects;
};

export const App = ({
  children,
  appMode = 'reader',
  config,
  tableOfContents,
  rangeEffects,
  editorTools,
  visualSurfaces,
  visualEffects,
}: PropsWithChildren<AppProps>) => {
  return (
    <AppModeContext.Provider value={appMode}>
      <StoreProvider>
        <MemoryRouter>
          <AppWrapper
            config={config}
            tableOfContents={tableOfContents}
            rangeEffects={rangeEffects}
            editorTools={editorTools}
            visualSurfaces={visualSurfaces}
            visualEffects={visualEffects}
          >
            <Suspense fallback={null}>
              <Routes>
                {children}
              </Routes>
            </Suspense>
          </AppWrapper>
        </MemoryRouter>
      </StoreProvider>
    </AppModeContext.Provider>
  );
};
