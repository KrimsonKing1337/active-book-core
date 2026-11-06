import type { FrameSide } from '@hooks/effects/frame/@types';

const frameWidth = (side: FrameSide) => `var(--visual-frame-${side}, var(--visual-frame-width, 12px))`;

const frameMaskGradients: Record<FrameSide, string> = {
  top: `linear-gradient(to bottom, black 0 ${frameWidth('top')}, transparent ${frameWidth('top')})`,
  right: `linear-gradient(to left, black 0 ${frameWidth('right')}, transparent ${frameWidth('right')})`,
  bottom: `linear-gradient(to top, black 0 ${frameWidth('bottom')}, transparent ${frameWidth('bottom')})`,
  left: `linear-gradient(to right, black 0 ${frameWidth('left')}, transparent ${frameWidth('left')})`,
};

export const getFrameMaskImage = (sides: FrameSide[]): string => {
  if (sides.length === 0) {
    return 'linear-gradient(transparent, transparent)';
  }

  const sideWithGradients = sides.map((cur) => frameMaskGradients[cur]);

  return sideWithGradients.join(', ');
};
