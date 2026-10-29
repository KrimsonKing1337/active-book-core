import type { RefObject } from 'react';

import { useEffect } from 'react';

const COLORS = ['red', 'blue'];

export const useColorPolice = (shadowRef: RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const element = shadowRef.current;

    if (!element) {
      return;
    }

    let index = 0;

    element.style.setProperty('--frame-shadow-color', COLORS[index]);

    const handleIteration = () => {
      index = (index + 1) % COLORS.length;

      element.style.setProperty('--frame-shadow-color', COLORS[index]);
    };

    element.addEventListener('animationiteration', handleIteration);

    return () => {
      element.removeEventListener('animationiteration', handleIteration);
      element.style.removeProperty('--frame-shadow-color');
    };
  }, [shadowRef]);
};
