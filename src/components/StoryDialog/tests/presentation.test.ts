import { getDialogMode } from '../presentation';

test.each(['image', 'video'])('uses media for a single %s', (type) => {
  expect(getDialogMode([{ type }])).toBe('media');
});

test('uses default for empty, text, mixed and unknown content without inspecting component children', () => {
  expect(getDialogMode([])).toBe('default');
  expect(getDialogMode([{ type: 'paragraph' }])).toBe('default');
  expect(getDialogMode([{ type: 'image' }, { type: 'paragraph' }])).toBe('default');
  expect(getDialogMode([{ type: 'image' }, { type: 'video' }])).toBe('default');
  expect(getDialogMode([{ type: 'coreComponent', content: [{ type: 'image' }] }])).toBe('default');
});

test('only the selected carousel slide determines presentation', () => {
  const carousel = [{
    type: 'carousel',
    content: [
      { type: 'carouselSlide', content: [{ type: 'image' }] },
      { type: 'carouselSlide', content: [{ type: 'paragraph' }] },
      { type: 'carouselSlide', content: [{ type: 'video' }] },
      { type: 'carouselSlide', content: [{ type: 'image' }, { type: 'paragraph' }] },
    ],
  }];

  expect(getDialogMode(carousel)).toBe('media');
  expect(getDialogMode(carousel, 1)).toBe('default');
  expect(getDialogMode(carousel, 2)).toBe('media');
  expect(getDialogMode(carousel, 3)).toBe('default');
  expect(getDialogMode([...carousel, { type: 'paragraph' }], 2)).toBe('default');
});

test('uses default for missing or invalid selection, empty slides and unsupported nested carousels', () => {
  expect(getDialogMode([{ type: 'carousel' }])).toBe('default');
  expect(getDialogMode([{ type: 'carousel', content: [{ type: 'image' }] }])).toBe('default');

  const emptySlide = [{ type: 'carousel', content: [{ type: 'carouselSlide' }] }];

  expect(getDialogMode(emptySlide)).toBe('default');
  expect(getDialogMode(emptySlide, -1)).toBe('default');
  expect(getDialogMode(emptySlide, 0.5)).toBe('default');
  expect(getDialogMode(emptySlide, 4)).toBe('default');

  const nested = [{ type: 'carousel', content: [{ type: 'carouselSlide', content: emptySlide }] }];

  expect(getDialogMode(nested)).toBe('default');
});
