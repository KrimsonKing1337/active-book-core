import type { VisualEffectLifetime } from '@active-book/types';

import type { RangeEffects } from '@types';

import type { BackgroundEffect } from '@hooks/effects/background/@types';
import type { FrameEffect } from '@hooks/effects/frame/@types';

import type { VisualEffects } from '../createVisualEffects';
import type { BuiltinDeclaration } from '../utils';

import { useBuiltinDeclarations } from './useBuiltinDeclarations';

export const useVisualRanges = (session: VisualEffects, ranges: RangeEffects) => {
  const declarations: BuiltinDeclaration[] = [];

  for (const rangeCur of ranges) {
    if (rangeCur.type !== 'background' && rangeCur.type !== 'frame') {
      continue;
    }

    // RangeEffects is the existing mixed declaration format; audio remains on its specialized path.
    const options = {
      ...rangeCur.options,
      id: rangeCur.id,
    } as BackgroundEffect | FrameEffect;

    const lifetime: VisualEffectLifetime = {
      type: 'range',
      range: rangeCur.range,
    };

    declarations.push({
      type: rangeCur.type,
      options,
      lifetime,
    });
  }

  useBuiltinDeclarations(session, declarations);
};
