import type { ReactNode } from 'react';

import { useState } from 'react';

import { useCarouselSlideActive } from '../../src/components/Carousel';

export const Slide = ({ id }: {
  id: string;
}) => {
  const isActive = useCarouselSlideActive();
  const [count, setCount] = useState(0);
  let media: ReactNode = null;

  if (id === 'video') {
    media = (
      <video
        data-testid="native-video"
        src="/tests/unifiedVisualEffects/movie.webm"
        controls
        muted
        playsInline
        style={{ width: '100%', height: 180 }}
      />
    );
  }

  return (
    <div data-testid={`slide-${id}`} data-active={isActive}>
      <div data-testid={`drag-${id}`} style={{ height: 100 }}>
        Slide {id}
      </div>

      <button type="button" onClick={() => setCount(count + 1)}>
        Count {id}: {count}
      </button>

      <input aria-label={`Input ${id}`} defaultValue="editable" />
      <a href="#carousel">Link {id}</a>

      <div contentEditable suppressContentEditableWarning aria-label={`Editable ${id}`}>
        Editable text
      </div>

      {media}
    </div>
  );
};
