import { useEffect, useRef, useState } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { Config } from '@types';
import type { SurfaceSpec } from '../@types';

import { StoreProvider } from '@store';

import { AppModeContext } from '@components/App/AppModeContext';
import { AppWrapper, useStoryGeometry } from '@components';

import { TestControls } from '../../storyVisualRoot/TestControls';
import { TestPage } from '../../storyVisualRoot/TestPage';

import { PlacementControls } from '../PlacementControls';
import { Probe } from '../Probe';

const config: Config = {
  id: 'visual-placement-browser-test',
  pages: 3,
  defaultTheme: 'dark',
};

export const PlacementBook = () => {
  const bookRef = useRef<HTMLDivElement>(null);
  const geometry = useStoryGeometry(bookRef);
  const [specs, setSpecs] = useState<SurfaceSpec[]>([]);
  const [selectedVisualEffectId, setSelectedVisualEffectId] = useState<string | null>(null);

  useEffect(() => {
    window.setVisualTestSurfaces = setSpecs;
    window.setVisualTestSelection = setSelectedVisualEffectId;
  }, []);

  const surfaces = specs.map((specCur) => {
    const { background, ...item } = specCur;

    const content = <Probe id={item.id} background={background} />;

    return {
      ...item,
      content,
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
    <AppModeContext value={new URLSearchParams(location.search).get('mode') === 'reader' ? 'reader' : 'editor'}>
      <StoreProvider>
        <MemoryRouter initialEntries={['/page-1']}>
          <AppWrapper
            ref={bookRef}
            config={config}
            tableOfContents={[]}
            rangeEffects={[]}
            visualSurfaces={surfaces}
            selectedVisualEffectId={selectedVisualEffectId}
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
