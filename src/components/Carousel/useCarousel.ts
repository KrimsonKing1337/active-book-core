import { useEffect, useState } from 'react';

import useEmblaCarousel from 'embla-carousel-react';

const dragSelectors = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  '[contenteditable="true"]',
];

export const useCarousel = () => {
  const [viewportRef, api] = useEmblaCarousel({
    align: 'start',
    loop: false,
    watchDrag: (_api, event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return true;
      }

      const selectorsString = dragSelectors.join(', ');

      return !target.closest(selectorsString);
    },
  });

  const [navigation, setNavigation] = useState({
    selected: 0,
    canPrevious: false,
    canNext: false,
  });

  useEffect(() => {
    if (!api) {
      return;
    }

    const synchronize = () => {
      setNavigation({
        selected: api.selectedScrollSnap(),
        canPrevious: api.canScrollPrev(),
        canNext: api.canScrollNext(),
      });
    };

    synchronize();
    api.on('select', synchronize);
    api.on('reInit', synchronize);

    return () => {
      api.off('select', synchronize);
      api.off('reInit', synchronize);
    };
  }, [api]);

  const previous = () => api?.scrollPrev();
  const next = () => api?.scrollNext();

  return {
    viewportRef,
    navigation,
    previous,
    next,
  };
};
