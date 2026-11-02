import { useContext } from 'react';

import type { VisualEffectLifetime } from '@active-book/types';

import {
  VisualEffectsContext,
  useBuiltinDeclarations,
  usePageLifetime,
} from '@controllers/visualEffects';

import type { FrameEffect } from './@types';

export const useFrameEffect = (effect: FrameEffect | null, lifetime?: VisualEffectLifetime) => {
  const session = useContext(VisualEffectsContext);
  const pageLifetime = usePageLifetime(session);
  const activeLifetime = lifetime ?? pageLifetime;
  const declarations = effect && activeLifetime ? [{
    type: 'frame' as const,
    options: effect,
    lifetime: activeLifetime,
  }] : [];

  useBuiltinDeclarations(session, declarations);
};
