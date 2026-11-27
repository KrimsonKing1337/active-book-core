import { store } from '@store';
import { mainSelectors } from '@store/main';

import { scrollDown, scrollUp } from '@utils/control/scroll';

type Fn = () => void;

export const addKeyboardControl = (goPrevPage: Fn, goNextPage: Fn) => {
  const narrativeElement = document.querySelector('#narrative');

  const listener = (e: KeyboardEvent) => {
    const hasModifierKey = e.ctrlKey || e.metaKey || e.altKey;

    if (e.defaultPrevented || hasModifierKey) {
      return;
    }

    const state = store.getState();
    const isPagePresented = mainSelectors.isPagePresented(state);
    const isWindowOpen = document.querySelector('[data-book-window-open="true"]') !== null;

    if (!isPagePresented || isWindowOpen) {
      return;
    }

    const { target } = e;

    let isTextInput = false;
    let isInsideCarousel = false;

    if (target instanceof HTMLElement) {
      const isFormControl = target.matches('input, textarea, select');

      isTextInput = target.isContentEditable || isFormControl;
    }

    if (target instanceof Element) {
      const carousel = target.closest('[data-book-carousel]');

      isInsideCarousel = carousel !== null;
    }

    if (isTextInput || isInsideCarousel) {
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
