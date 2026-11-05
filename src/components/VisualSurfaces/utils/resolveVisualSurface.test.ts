import type { StoryGeometry } from '@components/StoryRoot/geometry';

import type { VisualSurfaceItem } from '../@types';

import { resolveVisualSurface } from './resolveVisualSurface';
import { compareVisualSurfaces } from './order';

const geometry: StoryGeometry = {
  regions: {
    application: null,
    storyViewport: null,
    story: {
      x: 0,
      y: 0,
      width: 1000,
      height: 800,
    },
    narrativeFrame: {
      x: 100,
      y: 10,
      width: 800,
      height: 700,
    },
    frame: {
      x: 100,
      y: 10,
      width: 800,
      height: 700,
    },
    narrativeViewport: {
      x: 120,
      y: 30,
      width: 760,
      height: 660,
    },
    narrativeContent: {
      x: 120,
      y: -170,
      width: 760,
      height: 2000,
    },
  },
  frameInsets: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
};

const item: VisualSurfaceItem = {
  id: 'a',
  content: null,
  depth: {
    plane: 'belowNarrative',
    order: 0,
  },
  placement: {
    coordinates: 'narrativeContent',
    anchor: {
      region: 'narrativeContent',
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
  visibility: { region: 'story' },
};

test('content coordinates do not implicitly clip to the narrative viewport', () => {
  const resolved = resolveVisualSurface({
    item,
    geometry,
  });

  expect(resolved?.visibilityStyle).toEqual({
    left: 0,
    top: 0,
    width: 1000,
    height: 800,
  });
  expect(resolved?.surfaceStyle).toEqual({
    left: 120,
    top: -170,
    width: 760,
    height: 2000,
  });
});

test('frame geometry drives the existing side mask and missing insets fail closed', () => {
  const frameItem: VisualSurfaceItem = {
    ...item,
    visibility: {
      region: 'frame',
      sides: ['left', 'bottom'],
    },
  };
  const resolved = resolveVisualSurface({
    item: frameItem,
    geometry,
  });

  expect(resolved?.visibilityStyle.maskImage).toContain('var(--frame-left)');
  expect(resolved?.visibilityStyle.maskImage).toContain('var(--frame-bottom)');
  expect(resolved?.visibilityStyle['--frame-left']).toBe('20px');
  expect(resolved?.surfaceStyle.left).toBe(20);
  expect(resolveVisualSurface({
    item: frameItem,
    geometry: {
      ...geometry,
      frameInsets: null,
    },
  })).toBeNull();
});

test('missing geometry or visibility hides the item', () => {
  expect(resolveVisualSurface({
    item,
    geometry: null,
  })).toBeNull();
  expect(resolveVisualSurface({
    item: {
      ...item,
      visibility: { region: 'narrativeFrame' },
    },
    geometry: {
      ...geometry,
      regions: {
        ...geometry.regions,
        narrativeFrame: null,
      },
    },
  })).toBeNull();
});

test('sorting uses numeric order then ascending string id without locale rules', () => {
  const items = [
    {
      ...item,
      id: 'z',
    },
    {
      ...item,
      id: 'a',
    },
    {
      ...item,
      id: 'A',
    },
    {
      ...item,
      id: 'first',
      depth: {
        ...item.depth,
        order: -3,
      },
    },
    {
      ...item,
      id: 'last',
      depth: {
        ...item.depth,
        order: 3,
      },
    },
  ];
  expect(items.sort(compareVisualSurfaces).map((cur) => cur.id)).toEqual(['first', 'A', 'a', 'z', 'last']);
  expect(compareVisualSurfaces(item, item)).toBe(0);
});
