import type { KeyboardEvent } from 'react';

export const activateOnKey = (e: KeyboardEvent<HTMLElement>, activate: () => void) => {
  const wrongKey = e.key !== 'Enter' && e.key !== ' ';

  if (e.repeat || wrongKey) {
    return;
  }

  e.preventDefault();

  activate();
};
