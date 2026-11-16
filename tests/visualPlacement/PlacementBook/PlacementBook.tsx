import { useEffect, useRef, useState } from 'react';

import type { Config } from '@types';


import { StoreProvider } from '@store';

import { AppModeContext } from '@components/App/AppModeContext';
import { AppWrapper } from '@components';

import type { SurfaceSpec } from '../@types';

import { TestControls } from '../../storyRoot/TestControls';
import { TestPage } from '../../storyRoot/TestPage';

import { PlacementControls } from '../PlacementControls';
import { Probe } from '../Probe';

const config: Config = {
  id: 'visual-placement-browser-test',
  pages: 3,
  defaultTheme: 'dark',
};

export const PlacementBook = () => {
  const bookRef = useRef<HTMLDivElement>(null);
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
          visualSurfaces={surfaces}
          selectedVisualEffectId={selectedVisualEffectId}
          editorTools={tools}
        />
      </StoreProvider>
    </AppModeContext>
  );
};
