import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import useEmblaCarousel from 'embla-carousel-react';

import { recoverCarouselFocus } from './utils';

const dragSelectors = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'video[controls]',
  '[contenteditable="true"]',
];

export const useCarousel = (onSelect?: (index: number) => void) => {
  const onSelectRef = useRef(onSelect);
  const notifiedIndexRef = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const [viewportRef, api] = useEmblaCarousel({
    align: 'start',
    loop: false,
    watchDrag: (_api, event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return true;
      }

      const selectorsAsString = dragSelectors.join(', ');

      return !target.closest(selectorsAsString);
    },
  });

  const [navigation, setNavigation] = useState({
    selected: 0,
    canPrevious: false,
    canNext: false,
  });

  useEffect(() => {
    if (!api) {
      notifiedIndexRef.current = undefined;

      return;
    }

    const synchronize = () => {
      const selected = api.selectedScrollSnap();
      const slideNodes = api.slideNodes();

      recoverCarouselFocus(api);

      setNavigation({
        selected,
        canPrevious: api.canScrollPrev(),
        canNext: api.canScrollNext(),
      });

      if (!slideNodes.length) {
        notifiedIndexRef.current = undefined;

        return;
      }

      if (notifiedIndexRef.current !== selected) {
        notifiedIndexRef.current = selected;
        onSelectRef.current?.(selected);
      }
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
