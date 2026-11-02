import type { VisualEffectLifetime } from '@active-book/types';

import { useVisualEffects } from '@@/controllers/visualEffects/context';

import { useBuiltinDeclarations } from '@@/controllers/visualEffects/useBuiltinDeclarations';
import { usePageLifetime } from '@@/controllers/visualEffects/usePageLifetime';



import type { BackgroundEffect } from './@types';

export const useBackground = (effect: BackgroundEffect, lifetime?: VisualEffectLifetime) => {
  const session = useVisualEffects();
  const pageLifetime = usePageLifetime(session);
  const activeLifetime = lifetime ?? pageLifetime;
  const declarations = activeLifetime ? [{
    type: 'background' as const,
    options: effect,
    lifetime: activeLifetime,
  }] : [];

  return useBuiltinDeclarations(session, declarations);
};
