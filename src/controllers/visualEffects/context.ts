import { createContext, useContext } from 'react';

import type { VisualEffects } from './createVisualEffects';

export const VisualEffectsContext = createContext<VisualEffects | null>(null);

export const useVisualEffects = () => {
  const session = useContext(VisualEffectsContext);

  if (!session) {
    throw new Error('Visual effect declarations require a book visual effects session');
  }

  return session;
};
