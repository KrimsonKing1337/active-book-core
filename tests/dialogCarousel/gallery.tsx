import type { ReactNode } from 'react';

import { useState } from 'react';

import type { DialogContentNode } from '../../src/components/StoryDialog';

import { Carousel } from '../../src/components/Carousel';
import { Video } from '../../src/components/Video';

const imageSource = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="300">'
  + '<rect width="120" height="300" fill="rgb(0,200,80)"/></svg>',
);

export const Portrait = () => <img src={imageSource} alt="Portrait" />;

const TextSlide = () => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ minHeight: 1400 }}>
      <input aria-label="Slide input" defaultValue="Retained text" />

      <button type="button" onClick={() => setCount((previous) => previous + 1)}>
        Count {count}
      </button>

      <p>
        Long text slide, with its own vertical scrolling
      </p>
    </div>
  );
};

type Entry = {
  nodes: readonly DialogContentNode[];
  element: ReactNode;
};

// A test projection, not new book.json nodes. The same entries drive model and rendering.
const entries: readonly Entry[] = [
  { nodes: [{ type: 'paragraph' }], element: <TextSlide key="text" /> },
  { nodes: [{ type: 'image' }], element: <Portrait key="image" /> },
  {
    nodes: [{ type: 'video' }],
    element: (
      <Video
        key="video"
        id="presentation-video"
        data-testid="presentation-video"
        src="/tests/unifiedVisualEffects/movie.webm"
        controls
        loop
      />
    ),
  },
  {
    nodes: [{ type: 'paragraph' }, { type: 'image' }],
    element: (
      <div key="mixed">
        <p>
          Mixed slide
        </p>

        <Portrait />
      </div>
    ),
  },
];

export const galleryNodes: readonly DialogContentNode[] = [{
  type: 'carousel',
  content: entries.map((entry) => ({ type: 'carouselSlide', content: entry.nodes })),
}];

export const renderGallery = (onSelect: (index: number) => void) => (
  <Carousel layout="fill" slides={entries.map((entry) => entry.element)} onSelect={onSelect} />
);
