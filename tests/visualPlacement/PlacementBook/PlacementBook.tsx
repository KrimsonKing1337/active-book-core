import { useEffect, useRef, useState } from 'react';

import type { Config } from '@types';


import { StoreProvider } from '@store';

import { AppModeContext } from '@components/App/AppModeContext';
import { AppWrapper, useStoryGeometry } from '@components';

import type { SurfaceSpec } from '../@types';

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
    const {
      background,
      ...item
    } = specCur;

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
        <AppWrapper
          ref={bookRef}
          config={config}
          initialPageId="page-1"
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
          ]}
          tableOfContents={[]}
          rangeEffects={[]}
          visualSurfaces={surfaces}
          selectedVisualEffectId={selectedVisualEffectId}
          editorTools={tools}
        />
      </StoreProvider>
    </AppModeContext>
  );
};
