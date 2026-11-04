import type { VisualPlacement } from '@active-book/types';

import type { StoryGeometry } from '@components/StoryVisualRoot/geometry';

import { resolvePlacement } from './placement';

const geometry: StoryGeometry = {
  regions: {
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

const placement: VisualPlacement = {
  coordinates: 'narrativeContent',
  anchor: {
    region: 'story',
    point: 'bottom-right',
  },
  origin: 'center',
  offset: {
    x: {
      value: -10,
      unit: '%',
    },
    y: {
      value: 12,
      unit: 'px',
    },
  },
  size: {
    width: {
      value: 50,
      unit: '%',
    },
    height: {
      value: 40,
      unit: 'px',
    },
  },
};

test('uses coordinate dimensions for units and independent anchor/origin points', () => {
  expect(resolvePlacement(placement, geometry)).toEqual({
    x: 734,
    y: 792,
    width: 380,
    height: 40,
  });
});

test('a content anchor follows scrolling, while a book anchor remains fixed', () => {
  const scrolled: StoryGeometry = {
    ...geometry,
    regions: {
      ...geometry.regions,
      narrativeContent: {
        x: 120,
        y: -370,
        width: 760,
        height: 2000,
      },
    },
  };
  const contentPlacement: VisualPlacement = {
    ...placement,
    anchor: {
      region: 'narrativeContent',
      point: 'top-left',
    },
  };
  const before = resolvePlacement(contentPlacement, geometry);
  const after = resolvePlacement(contentPlacement, scrolled);

  expect(before).not.toBeNull();
  expect(after?.y).toBe((before?.y ?? 0) - 200);
  expect(resolvePlacement(placement, scrolled)).toEqual(resolvePlacement(placement, geometry));
});

test('unavailable anchor/coordinates and invalid sizes fail closed', () => {
  const missing: StoryGeometry = {
    ...geometry,
    regions: {
      ...geometry.regions,
      narrativeContent: null,
    },
  };
  expect(resolvePlacement(placement, missing)).toBeNull();
  expect(resolvePlacement({
    ...placement,
    anchor: {
      region: 'narrativeContent',
      point: 'top',
    },
  }, missing)).toBeNull();
  expect(resolvePlacement({
    ...placement,
    size: {
      width: {
        value: -1,
        unit: 'px',
      },
      height: {
        value: 1,
        unit: 'px',
      },
    },
  }, geometry)).toBeNull();
  expect(resolvePlacement({
    ...placement,
    offset: {
      x: {
        value: Infinity,
        unit: 'px',
      },
      y: {
        value: 0,
        unit: 'px',
      },
    },
  }, geometry)).toBeNull();
});
