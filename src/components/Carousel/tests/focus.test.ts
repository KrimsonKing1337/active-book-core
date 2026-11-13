import { recoverCarouselFocus } from '../utils';

test('moves focus out of an outgoing slide before it becomes inert', () => {
  const carousel = document.createElement('section');
  carousel.dataset.bookCarousel = '';
  carousel.tabIndex = 0;
  const viewport = document.createElement('div');
  const oldSlide = document.createElement('div');
  const selectedSlide = document.createElement('div');
  const input = document.createElement('input');
  oldSlide.append(input);
  viewport.append(oldSlide, selectedSlide);
  carousel.append(viewport);
  document.body.append(carousel);
  input.focus();
  const api = {
    slideNodes: () => [oldSlide, selectedSlide],
    selectedScrollSnap: () => 1,
    rootNode: () => viewport,
  };

  recoverCarouselFocus(api);
  expect(document.activeElement).toBe(carousel);
  selectedSlide.append(input);
  input.focus();
  recoverCarouselFocus(api);
  expect(document.activeElement).toBe(input);
  const outside = document.createElement('button');
  document.body.append(outside);
  outside.focus();
  recoverCarouselFocus(api);
  expect(document.activeElement).toBe(outside);
  carousel.remove();
  outside.remove();
});
