import { useRef, useState } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import type { RangeEffects } from '../../../src/@types';
import { AppModeContext } from '../../../src/components/App/AppModeContext';
import { AppWrapper } from '../../../src/components/AppWrapper';
import { useBookGeometry } from '../../../src/components/BookVisualRoot';

import { EffectControls } from '../EffectControls';
import { EffectsPage } from '../EffectsPage';
import { metrics, VisualCounter } from '../VisualCounter';

const query = new URLSearchParams(location.search);
const compatibility = query.has('compat');
const ranges = [{
  from: 1,
  to: 2,
}, {
  from: 4,
  to: 4,
}];
const rangeEffects: RangeEffects = compatibility ? [] : [
  {
    id: 'range-background',
    type: 'background',
    range: ranges,
    options: {
      kind: 'component',
      Component: <VisualCounter label="range-background-state" />,
    },
  },
  {
    id: 'range-image',
    type: 'background',
    range: ranges,
    options: {
      kind: 'image',
      image: {
        id: 'range-picture',
        src: '/tests/unifiedVisualEffects/range-pattern.svg',
      },
    },
  },
  {
    id: 'range-video',
    type: 'background',
    range: ranges,
    options: {
      kind: 'video',
      video: {
        id: 'range-movie',
        src: '/tests/unifiedVisualEffects/movie.webm',
        autoPlay: true,
      },
    },
  },
  {
    id: 'range-frame',
    type: 'frame',
    range: ranges,
    options: {
      kind: 'component',
      Component: <VisualCounter label="range-frame-state" />,
    },
  },
  ...(['pulse', 'police', 'caramel'] as const).map((preset) => ({
    id: `range-${preset}`,
    type: 'frame' as const,
    range: ranges,
    options: {
      kind: 'shadow' as const,
      shadow: {
        id: preset,
        sides: ['left', 'right'] as ('left' | 'right')[],
        thickness: 60,
        animation: {
          preset,
          duration: 2000,
        },
      },
    },
  })),
];

export const EffectsBook = () => {
  const bookRef = useRef<HTMLDivElement>(null);
  const geometry = useBookGeometry(bookRef);
  const [pageCount, setPageCount] = useState(5);
  window.realVisualMetrics = metrics;
  window.setRealPageCount = setPageCount;
  const tools = (
    <>
      <EffectControls />
      <output data-testid="geometry" hidden>
        {JSON.stringify(geometry)}
      </output>
    </>
  );

  return (
    <AppModeContext value={query.get('mode') === 'editor' ? 'editor' : 'reader'}>
      <MemoryRouter>
        <AppWrapper
          ref={bookRef}
          config={{
            id: 'real-visual-effects',
            pages: pageCount,
            defaultTheme: 'dark',
          }}
          rangeEffects={rangeEffects}
          tableOfContents={[]}
          editorTools={tools}
        >
          <Routes>
            <Route path="/" element={null} />
            {[1, 2, 3, 4, 5].map((number) => (
              <Route key={number} path={`/page-${number}`} element={<EffectsPage key={number} number={number} />} />
            ))}
          </Routes>
        </AppWrapper>
      </MemoryRouter>
    </AppModeContext>
  );
};

declare global {
  interface Window {
    realVisualMetrics: typeof metrics;
    setRealPageCount: (count: number) => void;
  }
}
