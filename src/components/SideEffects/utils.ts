import type { FrameSide } from '@hooks/effects/side/@types';

const frameMaskGradients: Record<FrameSide, string> = {
  top: 'linear-gradient(to bottom, black 0 var(--frame-top), transparent var(--frame-top))',
  right: 'linear-gradient(to left, black 0 var(--frame-right), transparent var(--frame-right))',
  bottom: 'linear-gradient(to top, transparent 0 var(--narrative-controls-height), black var(--narrative-controls-height) calc(var(--narrative-controls-height) + var(--frame-bottom)), transparent calc(var(--narrative-controls-height) + var(--frame-bottom)))',
  left: 'linear-gradient(to right, black 0 var(--frame-left), transparent var(--frame-left))',
};

export const getFrameMaskImage = (sides: FrameSide[]): string => {
  if (sides.length === 0) {
    return 'linear-gradient(transparent, transparent)';
  }

  return sides.map((sideCur) => frameMaskGradients[sideCur]).join(', ');
};
