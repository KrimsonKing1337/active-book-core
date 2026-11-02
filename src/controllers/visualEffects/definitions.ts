import { BackgroundRenderer } from '@components/BackgroundEffects/components/BackgroundRenderer';
import { FrameRenderer } from '@components/FrameEffects/components/FrameRenderer';

import type { HostVisualEffectDefinition } from './@types';

import { BACKGROUND_DEFINITION, FRAME_DEFINITION, FEEDBACK_DEFINITION } from './constants';

export * from './constants';

export const builtinVisualDefinitions: readonly HostVisualEffectDefinition[] = [
  {
    id: BACKGROUND_DEFINITION,
    defaultParams: {},
    Renderer: BackgroundRenderer,
  },
  {
    id: FRAME_DEFINITION,
    defaultParams: {},
    Renderer: FrameRenderer,
  },
  {
    id: FEEDBACK_DEFINITION,
    defaultParams: {},
    Renderer: FrameRenderer,
    systemFeedback: true,
  },
];
