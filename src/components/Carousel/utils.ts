import type { EmblaCarouselType } from 'embla-carousel';

type FocusApi = Pick<
  EmblaCarouselType,
  | 'slideNodes'
  | 'selectedScrollSnap'
  | 'rootNode'>;

export const recoverCarouselFocus = (api: FocusApi) => {
  const focused = document.activeElement;

  const slides = api.slideNodes();
  const selected = slides[api.selectedScrollSnap()];

  const focusedSlide = slides.find((slideCur) => {
    return slideCur.contains(focused);
  });

  if (focusedSlide && focusedSlide !== selected) {
    const carousel = api.rootNode().closest<HTMLElement>('[data-book-carousel]');

    carousel?.focus({ preventScroll: true });
  }
};
