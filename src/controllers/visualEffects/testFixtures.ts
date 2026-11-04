import type { VisualEffectRegistration } from '@active-book/types';

// Shared data fixture; this file contains no runtime setup or renderer resources.
export const registration: VisualEffectRegistration = {
  effect: {
    id: 'test',
    definitionId: 'static',
    params: { label: 'first' },
    placement: {
      coordinates: 'narrativeFrame',
      anchor: {
        region: 'narrativeFrame',
        point: 'top-left',
      },
      origin: 'top-left',
      offset: {
        x: {
          value: 0,
          unit: 'px',
        },
        y: {
          value: 0,
          unit: 'px',
        },
      },
      size: {
        width: {
          value: 100,
          unit: '%',
        },
        height: {
          value: 100,
          unit: '%',
        },
      },
    },
    visibility: { region: 'narrativeFrame' },
    depth: {
      plane: 'aboveNarrative',
      order: 0,
    },
  },
  lifetime: {
    type: 'page',
    page: 1,
  },
};
