import { useEffect, useState } from 'react';

import { Carousel, useCarouselSlideActive } from '../../src/components/Carousel';

import { Slide } from './Slide';

type Selection = {
  index: number;
  version: number;
};

declare global {
  interface Window {
    carouselFixture: {
      setSlides: (slides: string[]) => void;
      setWidth: (width: number) => void;
      rerender: () => void;
      changeCallback: () => void;
    };
  }
}

export const Content = () => {
  const [ids, setSlides] = useState([
    'a',
    'b',
    'c',
  ]);
  const [width, setWidth] = useState(600);
  const [version, setVersion] = useState(0);
  const [revision, setRevision] = useState(0);
  const [selections, setSelections] = useState<Selection[]>([]);
  const outsideActive = useCarouselSlideActive();

  useEffect(() => {
    window.carouselFixture = {
      setSlides,
      setWidth,
      rerender: () => setRevision((value) => value + 1),
      changeCallback: () => setVersion((value) => value + 1),
    };
  }, []);

  const handleSelect = (index: number) => {
    setSelections((previous) => [...previous, { index, version }]);
  };

  const slides = ids.map((id) => <Slide key={id} id={id} />);

  return (
    <div>
      <output data-testid="outside-active">{String(outsideActive)}</output>
      <output data-testid="selections">{JSON.stringify(selections)}</output>
      <output data-testid="revision">{revision}</output>
      <output data-testid="callback-version">{version}</output>

      <div data-testid="carousel-container" style={{ width, maxWidth: '100%' }}>
        <Carousel slides={slides} onSelect={handleSelect} />
      </div>

      <div data-testid="reader-background" style={{ height: 100 }}>
        Reader background swipe area
      </div>
    </div>
  );
};
