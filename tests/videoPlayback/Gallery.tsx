import { useEffect, useState } from 'react';

import { Carousel } from '../../src/components/Carousel';
import { Video } from '../../src/components/Video';

type GalleryProps = {
  prefix: string;
};

declare global {
  interface Window {
    videoFixture: {
      resize: () => void;
      rerender: () => void;
      changeSource: () => void;
    };
  }
}

export const Gallery = ({ prefix }: GalleryProps) => {
  const [width, setWidth] = useState(600);
  const [revision, setRevision] = useState(0);
  const [source, setSource] = useState('first');
  const params = new URLSearchParams(location.search);
  const autoPlay = params.get('autoplay') !== 'false';
  const loop = params.get('loop') !== 'false';

  useEffect(() => {
    window.videoFixture = {
      resize: () => setWidth(300),
      rerender: () => setRevision((value) => value + 1),
      changeSource: () => setSource('second'),
    };
  }, []);

  const slides = ['a', 'b'].map((name) => {
    const id = `${prefix}-${name}`;

    return (
      <Video
        key={name}
        id={id}
        data-testid={id}
        src={`/tests/unifiedVisualEffects/movie.webm?id=${id}&source=${source}`}
        controls
        loop={loop}
        autoPlay={autoPlay}
        style={{
          display: 'block',
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          height: 180,
        }}
      />
    );
  });

  return (
    <div data-testid={`${prefix}-gallery`} style={{ width, maxWidth: '100%' }}>
      <output data-testid="revision">{revision}</output>
      <Carousel slides={slides} />
    </div>
  );
};
