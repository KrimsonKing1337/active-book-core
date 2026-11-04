import { fillRegion } from '@controllers/visualEffects/utils/declarations';

import type { VisualSurfaceItem } from '../@types';

import { supportsCssLayout } from './cssLayout';

test('CSS supports common independent frame clipping but diagnoses cross-region anchors', () => {
  const item: VisualSurfaceItem = {
    id: 'frame',
    content: null,
    placement: fillRegion('storyViewport'),
    visibility: { region: 'frame', sides: ['left', 'right'] },
    depth: { plane: 'aboveNarrative', order: 0 },
  };
  expect(supportsCssLayout(item)).toBe(true);
  const custom = {
    ...item,
    placement: {
      ...item.placement,
      anchor: { region: 'narrativeContent' as const, point: 'top-left' as const },
    },
  };
  expect(supportsCssLayout(custom)).toBe(false);
});
