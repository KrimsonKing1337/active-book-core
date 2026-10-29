import type { FrameSide } from '@hooks/effects/side/@types';

import { getFrameMaskImage } from './utils';

test('limits a custom effect to the selected sides', () => {
  const image = getFrameMaskImage(['top', 'left']);

  expect(image).toContain('var(--frame-top)');
  expect(image).toContain('var(--frame-left)');
  expect(image).not.toContain('var(--frame-right)');
  expect(image).not.toContain('var(--frame-bottom)');
});

test('places the bottom frame at the edge of the narrative area', () => {
  const image = getFrameMaskImage(['bottom']);

  expect(image).toBe('linear-gradient(to top, black 0 var(--frame-bottom), transparent var(--frame-bottom))');
});

test('combines independent side masks into one component surface', () => {
  const sides: FrameSide[] = ['top', 'right', 'bottom', 'left'];
  const image = getFrameMaskImage(sides);

  expect(image.split('linear-gradient(')).toHaveLength(5);
});

test('hides the entire component surface when no sides are selected', () => {
  expect(getFrameMaskImage([])).toBe('linear-gradient(transparent, transparent)');
});
