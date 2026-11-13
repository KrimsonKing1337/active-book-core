import { StrictMode, useState } from 'react';

import { createRoot } from 'react-dom/client';

import type { VisualRegion } from '@active-book/types';

import { BookApplicationSurface } from '../../src/components/BookApplicationSurface';
import { StoryRegionsProvider, useStoryRegions } from '../../src/components/StoryRegionsProvider';
import { VisualSelectionOutline } from '../../src/components/VisualSelectionOutline';
import type { VisualSurfaceItem } from '../../src/components/VisualSurfaces';

const Regions = () => {
  const { refs, elements } = useStoryRegions();
  const [width, setWidth] = useState(600);
  const [top, setTop] = useState(40);
  const [region, setRegion] = useState<VisualRegion>('narrativeContent');
  const scale = Number(new URLSearchParams(location.search).get('scale') ?? '1');
  const item: VisualSurfaceItem = {
    id: 'selected',
    placement: { region },
    depth: { plane: 'aboveNarrative' },
    content: null,
  };

  return (
    <>
      <button type="button" onClick={() => setWidth(420)}>
        Resize preview
      </button>

      <button
        type="button"
        onClick={() => {
          if (elements.narrativeViewport) {
            elements.narrativeViewport.style.height = '140px';
          }
        }}
      >
        Resize narrative viewport
      </button>

      <button type="button" onClick={() => setRegion('narrativeViewport')}>
        Select viewport
      </button>

      <button type="button" onClick={() => setTop(80)}>
        Move region without resizing
      </button>

      <BookApplicationSurface
        style={{
          position: 'absolute',
          left: 120,
          top: 100,
          width,
          height: 500,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div ref={refs.story} style={{ width: '100%', height: '100%' }}>
          <div
            ref={refs.narrativeViewport}
            data-testid="viewport"
            style={{
              position: 'absolute',
              left: 30,
              top,
              width: 'calc(100% - 60px)',
              height: 260,
              overflow: 'auto',
            }}
          >
            <div
              ref={refs.narrativeContent}
              data-testid="content"
              style={{
                width: '100%',
                height: 1000,
                borderRadius: top / 4,
              }}
            >
              Narrative content
            </div>
          </div>
        </div>

        <VisualSelectionOutline item={item} />
      </BookApplicationSurface>
    </>
  );
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing outline fixture root');
}

createRoot(root).render(
  <StrictMode>
    <StoryRegionsProvider>
      <Regions />
    </StoryRegionsProvider>
  </StrictMode>,
);
