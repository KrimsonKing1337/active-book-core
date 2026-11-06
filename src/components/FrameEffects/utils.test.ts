import type { FrameSide } from '@hooks/effects/frame/@types';

import { getFrameMaskImage } from './utils';

test('limits a custom effect to the selected sides', () => {
  const image = getFrameMaskImage(['top', 'left']);

  expect(image).toContain('var(--visual-frame-width, 12px)');
  expect(image).toContain('var(--visual-frame-width, 12px)');
  expect(image).not.toContain('to left');
  expect(image).not.toContain('to top');
});

test('places the bottom frame at the edge of the narrative area', () => {
  const image = getFrameMaskImage(['bottom']);

  const width = 'var(--visual-frame-width, 12px)';
  expect(image).toBe(`linear-gradient(to top, black 0 ${width}, transparent ${width})`);
});

test('combines independent side masks into one component surface', () => {
  const sides: FrameSide[] = ['top', 'right', 'bottom', 'left'];
  const image = getFrameMaskImage(sides);

  expect(image.split('linear-gradient(')).toHaveLength(5);
});

test('hides the entire component surface when no sides are selected', () => {
  expect(getFrameMaskImage([])).toBe('linear-gradient(transparent, transparent)');
});
