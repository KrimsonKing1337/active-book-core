import { scrollDown, scrollUp } from '@utils/control/scroll';

type Fn = () => void;

export const addKeyboardControl = (goPrevPage: Fn, goNextPage: Fn) => {
  const narrativeElement = document.querySelector('#narrative');

  const listener = (e: KeyboardEvent) => {
    const target = e.target;
    const isTextInput = target instanceof HTMLElement
      && (target.isContentEditable || target.matches('input, textarea, select'));
    const hasOpenWindow = document.querySelector('[data-book-window-open="true"]');
    const isCarousel = target instanceof Element && target.closest('[data-book-carousel]');

    if (isTextInput || hasOpenWindow || isCarousel || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    const { code, repeat } = e;

    if (code === 'ArrowLeft' || code === 'KeyA') {
      if (repeat) {
        return;
      }

      goPrevPage();

      return;
    }

    if (code === 'ArrowRight' || code === 'KeyD') {
      if (repeat) {
        return;
      }

      goNextPage();

      return;
    }

    const behavior = repeat ? 'auto' : 'smooth';
    const scrollSpeed = repeat ? 20 : 75;

    if (code === 'KeyW') {
      scrollUp({
        elem: narrativeElement as HTMLElement,
        behavior,
        scrollValue: scrollSpeed,
      });

      return;
    }

    if (code === 'KeyS') {
      scrollDown({
        elem: narrativeElement as HTMLElement,
        behavior,
        scrollValue: scrollSpeed,
      });

      return;
    }
  };

  document.addEventListener('keydown', listener);

  return () => {
    document.removeEventListener('keydown', listener);
  };
};
