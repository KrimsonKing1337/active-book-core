import type { PropsWithChildren, ReactNode } from 'react';

import { Suspense } from 'react';

import { MemoryRouter } from 'react-router-dom';

import type { AppMode, RangeEffects, Config, TableOfContents } from '@types';

import { StoreProvider } from '@store';

import { AppWrapper } from '@components/AppWrapper';
import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { AppModeContext } from './AppModeContext';
import { Routes } from './Routes';

export type AppProps = {
  appMode?: AppMode;
  config: Config;
  tableOfContents: TableOfContents;
  rangeEffects: RangeEffects;
  editorTools?: ReactNode;
  visualSurfaces?: readonly VisualSurfaceItem[];
};

export const App = ({
  children,
  appMode = 'reader',
  config,
  tableOfContents,
  rangeEffects,
  editorTools,
  visualSurfaces,
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
