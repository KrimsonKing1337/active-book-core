import type {
  JsonObject, VisualEffectLifetime, VisualEffectRegistration, VisualPlacement,
} from '@active-book/types';

import type { BackgroundEffect } from '@hooks/effects/background/@types';
import type { FrameEffect } from '@hooks/effects/frame/@types';

import { BACKGROUND_DEFINITION, FEEDBACK_DEFINITION, FRAME_DEFINITION } from '../constants.js';

export type BuiltinDeclaration = {
  type: 'background' | 'frame';
  options: BackgroundEffect | FrameEffect;
  lifetime: VisualEffectLifetime;
};

export const fillRegion = (region: VisualPlacement['region']): VisualPlacement => ({ region });

export const createBuiltinRegistration = ({
  type,
  options,
  lifetime,
}: BuiltinDeclaration): VisualEffectRegistration => {
  // Optional CSS properties disappear in the JSON copy.
  const data: Partial<BackgroundEffect | FrameEffect> = { ...options };
  delete data.id;
  delete data.order;
  const params: JsonObject = JSON.parse(JSON.stringify(data));
  const isBackground = type === 'background';

  let definitionId = BACKGROUND_DEFINITION;
  let placement = fillRegion('storyViewport');
  let visibility: VisualEffectRegistration['effect']['visibility'] = {};
  let plane: VisualEffectRegistration['effect']['depth']['plane'] = 'background';
  const order = options.order ?? 0;

  if (!isBackground) {
    const frame = options as FrameEffect;
    placement = fillRegion('storyViewportFrame');
    definitionId = frame.layer === 'overlay' ? FEEDBACK_DEFINITION : FRAME_DEFINITION;
    plane = frame.layer === 'above' ? 'aboveNarrative' : 'belowNarrative';

    if (frame.kind === 'component' && frame.frameMask?.enabled) {
      visibility = {
        sides: frame.frameMask.sides,
      };
    }
  }

  const effect: VisualEffectRegistration['effect'] = {
    id: options.id,
    definitionId,
    params,
    placement,
    visibility,
    depth: {
      plane,
      order,
    },
  };

  return {
    effect,
    lifetime,
  };
};
