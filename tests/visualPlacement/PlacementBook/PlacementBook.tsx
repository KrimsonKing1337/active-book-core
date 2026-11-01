import { useEffect, useRef, useState } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { Config } from '../../../src/@types';
import type { SurfaceSpec } from '../@types';

import { StoreProvider } from '../../../src/store';
import { AppWrapper } from '../../../src/components/AppWrapper';
import { AppModeContext } from '../../../src/components/App/AppModeContext';
import { useBookGeometry } from '../../../src/components/BookVisualRoot';

import { TestControls } from '../../bookVisualRoot/TestControls';
import { TestPage } from '../../bookVisualRoot/TestPage';

import { PlacementControls } from '../PlacementControls';
import { Probe } from '../Probe';

const config: Config = {
  id: 'visual-placement-browser-test',
  pages: 3,
  defaultTheme: 'dark',
};

export const PlacementBook = () => {
  const bookRef = useRef<HTMLDivElement>(null);
  const geometry = useBookGeometry(bookRef);
  const [specs, setSpecs] = useState<SurfaceSpec[]>([]);

  useEffect(() => {
    window.setVisualTestSurfaces = setSpecs;
  }, []);

  const surfaces = specs.map((specCur) => {
    const { background, ...item } = specCur;

    return {
      ...item,
      content: <Probe id={item.id} background={background} />,
    };
  });

  const tools = (
    <>
      <TestControls />

      <PlacementControls />

      <output data-testid="geometry" hidden>
        {JSON.stringify(geometry)}
      </output>
    </>
  );

  return (
    <AppModeContext value="editor">
      <StoreProvider>
        <MemoryRouter initialEntries={['/page-1']}>
          <AppWrapper
            ref={bookRef}
            config={config}
            tableOfContents={[]}
            rangeEffects={[]}
            visualSurfaces={surfaces}
            editorTools={tools}
          >
            <Routes>
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
