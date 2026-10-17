import { getAllElementsWithPseudoClass } from './getAllElementsWithPseudoClass';
import { replaceCssPseudoClassWith } from './replaceCssPseudoClassWith';
import { selectorInsteadOfHover } from './utils';

const setTouchMode = (isTouch: boolean) => {
  const { classList } = document.body;

  if (classList.contains('is-touch') === isTouch) {
    return;
  }

  const from = isTouch ? ':hover' : `.${selectorInsteadOfHover}`;
  const to = isTouch ? `.${selectorInsteadOfHover}` : ':hover';

  replaceCssPseudoClassWith(from, to);

  classList.toggle('is-touch', isTouch);
};

const pointerDownHandler = (event: PointerEvent) => {
  if (event.pointerType === 'touch') {
    setTouchMode(true);
  }
};

const pointerOverHandler = (event: PointerEvent) => {
  if (event.pointerType === 'mouse') {
    setTouchMode(false);
  }
};

export const addTouchSupportForCssHover = () => {
  const elementsWithHover = getAllElementsWithPseudoClass(':hover');

  elementsWithHover.forEach((elementCur) => {
    if (!elementCur) {
      return;
    }

    const addClassListHover = () => elementCur.classList.add(selectorInsteadOfHover);
    const removeClassListHover = () => elementCur.classList.remove(selectorInsteadOfHover);

    elementCur.addEventListener('touchstart', addClassListHover);
    elementCur.addEventListener('touchmove', addClassListHover);
    elementCur.addEventListener('touchend', removeClassListHover);
    elementCur.addEventListener('touchcancel', removeClassListHover);
  });

  document.addEventListener('pointerdown', pointerDownHandler);
  document.addEventListener('pointerover', pointerOverHandler);
};
