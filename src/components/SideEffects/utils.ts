import type { FrameSide } from '@hooks/effects/side/@types';

const frameMaskGradients: Record<FrameSide, string> = {
  top: 'linear-gradient(to bottom, black 0 var(--frame-top), transparent var(--frame-top))',
  right: 'linear-gradient(to left, black 0 var(--frame-right), transparent var(--frame-right))',
  bottom: 'linear-gradient(to top, black 0 var(--frame-bottom), transparent var(--frame-bottom))',
  left: 'linear-gradient(to right, black 0 var(--frame-left), transparent var(--frame-left))',
};

export const getFrameMaskImage = (sides: FrameSide[]): string => {
  if (sides.length === 0) {
    return 'linear-gradient(transparent, transparent)';
  }

  const sideWithGradients = sides.map((cur) => frameMaskGradients[cur]);

  return sideWithGradients.join(', ');
};
