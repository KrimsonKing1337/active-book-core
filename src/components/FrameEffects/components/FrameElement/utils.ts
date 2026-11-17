import type { FramePosition } from '@hooks/effects/frame/@types';

export type PositionCoordinates = Record<FramePosition, [string, string, string, string]>;

export const getPositionCoordinatesDefault = (): PositionCoordinates => {
  return {
    'top-left': [
      '0%',
      '0%',
      '0%',
      '0%',
    ],
    top: [
      '50%',
      '0%',
      '-50%',
      '0%',
    ],
    'top-right': [
      '100%',
      '0%',
      '-100%',
      '0%',
    ],
    left: [
      '0%',
      '50%',
      '0%',
      '-50%',
    ],
    center: [
      '50%',
      '50%',
      '-50%',
      '-50%',
    ],
    right: [
      '100%',
      '50%',
      '-100%',
      '-50%',
    ],
    'bottom-left': [
      '0%',
      '100%',
      '0%',
      '-100%',
    ],
    bottom: [
      '50%',
      '100%',
      '-50%',
      '-100%',
    ],
    'bottom-right': [
      '100%',
      '100%',
      '-100%',
      '-100%',
    ],
  };
};
