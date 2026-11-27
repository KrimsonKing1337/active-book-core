import { useContext } from 'react';

import type { EffectLifetime } from '@active-book/types';

import {
  type BuiltinDeclaration,
  VisualEffectsContext,
  usePageLifetime,
  useVisualRegistrations,
  createBuiltinRegistration,
} from '@controllers/visualEffects';

import type { FrameEffect } from './@types';

export const useFrameEffect = (effect: FrameEffect | null, lifetime?: EffectLifetime) => {
  const session = useContext(VisualEffectsContext);
  const pageLifetime = usePageLifetime(session);

  const activeLifetime = lifetime ?? pageLifetime;

  const declarations: BuiltinDeclaration[] = [];

  if (effect && activeLifetime) {
    declarations.push({
      type: 'frame' as const,
      options: effect,
      lifetime: activeLifetime,
    });
  }

  const registrations = declarations.map(createBuiltinRegistration);

  useVisualRegistrations({ session, registrations });
};
