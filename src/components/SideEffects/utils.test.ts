import type { FrameSide } from '@hooks/effects/side/@types';

import { getFrameMaskImage } from './utils';

test('limits a custom effect to the selected sides', () => {
  const image = getFrameMaskImage(['top', 'left']);

  expect(image).toContain('var(--frame-top)');
  expect(image).toContain('var(--frame-left)');
  expect(image).not.toContain('var(--frame-right)');
  expect(image).not.toContain('var(--frame-bottom)');
});

test('places the bottom frame directly above the narrative controls', () => {
  const image = getFrameMaskImage(['bottom']);

  expect(image).toContain('var(--narrative-controls-height)');
  expect(image).toContain('var(--frame-bottom)');
  expect(image).toContain('transparent calc(var(--narrative-controls-height) + var(--frame-bottom))');
});

test('combines independent side masks into one component surface', () => {
  const sides: FrameSide[] = ['top', 'right', 'bottom', 'left'];
  const image = getFrameMaskImage(sides);

  expect(image.split('linear-gradient(')).toHaveLength(5);
});

test('hides the entire component surface when no sides are selected', () => {
  expect(getFrameMaskImage([])).toBe('linear-gradient(transparent, transparent)');
});
