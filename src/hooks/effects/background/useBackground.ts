import type { VisualEffectLifetime } from '@active-book/types';

import { useBuiltinDeclarations, usePageLifetime, useVisualEffects } from '@controllers/visualEffects';

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
