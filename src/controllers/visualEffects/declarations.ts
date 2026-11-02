import type {
  JsonObject, VisualEffectLifetime, VisualEffectRegistration, VisualPlacement,
} from '@active-book/types';

import type { BackgroundEffect } from '@hooks/effects/background/@types';
import type { FrameEffect } from '@hooks/effects/frame/@types';

import { BACKGROUND_DEFINITION, FEEDBACK_DEFINITION, FRAME_DEFINITION } from './definitions';

export type BuiltinDeclaration = {
  type: 'background' | 'frame';
  options: BackgroundEffect | FrameEffect;
  lifetime: VisualEffectLifetime;
};

export const fillRegion = (region: VisualPlacement['coordinates']): VisualPlacement => ({
  coordinates: region,
  anchor: {
    region,
    point: 'top-left',
  },
  origin: 'top-left',
  offset: {
    x: {
      value: 0,
      unit: 'px',
    },
    y: {
      value: 0,
      unit: 'px',
    },
  },
  size: {
    width: {
      value: 100,
      unit: '%',
    },
    height: {
      value: 100,
      unit: '%',
    },
  },
});

const readOrder = (value: unknown): number => {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
};

export const createBuiltinRegistration = ({ type,
  options,
  lifetime }: BuiltinDeclaration): VisualEffectRegistration => {
  // CSS optional properties disappear in the JSON copy; the React node stays in the runtime bridge.
  const data: Partial<BackgroundEffect | FrameEffect> = { ...options };
  delete data.id;
  delete data.Component;
  const params: JsonObject = JSON.parse(JSON.stringify(data));
  const isBackground = type === 'background';

  let definitionId = BACKGROUND_DEFINITION;
  let placement = fillRegion('bookViewport');
  let visibility: VisualEffectRegistration['effect']['visibility'] = { region: 'bookViewport' };
  let plane: VisualEffectRegistration['effect']['depth']['plane'] = 'background';
  let order = 0;

  if (isBackground) {
    const background = options as BackgroundEffect;
    order = readOrder(background.style?.zIndex
      ?? background.image?.style?.zIndex
      ?? background.video?.style?.zIndex
      ?? background.shadow?.style?.zIndex);
  } else {
    const frame = options as FrameEffect;
    definitionId = frame.layer === 'overlay' ? FEEDBACK_DEFINITION : FRAME_DEFINITION;
    placement = fillRegion('page');
    visibility = { region: 'page' };
    plane = frame.layer === 'above' ? 'aboveNarrative' : 'scene';
    order = readOrder(frame.shadow?.style?.zIndex ?? frame.text?.style?.zIndex ?? frame.style?.zIndex);

    if (frame.kind === 'component' && frame.frameMask?.enabled) {
      visibility = {
        region: 'frame',
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
