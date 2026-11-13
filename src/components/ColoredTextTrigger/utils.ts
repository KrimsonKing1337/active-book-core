import type { KeyboardEvent } from 'react';

export const activateOnKey = (event: KeyboardEvent<HTMLElement>, activate: () => void) => {
  if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) {
    return;
  }

  event.preventDefault();
  activate();
};
