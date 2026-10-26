import type { RefObject } from 'react';

import { useEffect } from 'react';

const COLORS = [
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#0000FF',
  '#4B0082',
  '#9400D3',
];

export const useColorCarameldansen = (shadowRef: RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const element = shadowRef.current;

    if (!element) {
      return;
    }

    let index = 0;

    element.style.setProperty('--side-shadow-color', COLORS[index]);

    const handleIteration = () => {
      index = (index + 1) % COLORS.length;

      element.style.setProperty('--side-shadow-color', COLORS[index]);
    };

    element.addEventListener('animationiteration', handleIteration);

    return () => {
      element.removeEventListener('animationiteration', handleIteration);
      element.style.removeProperty('--side-shadow-color');
    };
  }, [shadowRef]);
};
