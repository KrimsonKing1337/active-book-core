import type { FrameSide } from '@hooks/effects/frame/@types';

const frameWidth = 'var(--visual-frame-width, 12px)';

const frameMaskGradients: Record<FrameSide, string> = {
  top: `linear-gradient(to bottom, black 0 ${frameWidth}, transparent ${frameWidth})`,
  right: `linear-gradient(to left, black 0 ${frameWidth}, transparent ${frameWidth})`,
  bottom: `linear-gradient(to top, black 0 ${frameWidth}, transparent ${frameWidth})`,
  left: `linear-gradient(to right, black 0 ${frameWidth}, transparent ${frameWidth})`,
};

export const getFrameMaskImage = (sides: FrameSide[]): string => {
  if (sides.length === 0) {
    return 'linear-gradient(transparent, transparent)';
  }

  const sideWithGradients = sides.map((cur) => frameMaskGradients[cur]);

  return sideWithGradients.join(', ');
};
