import { BackgroundRenderer } from '@components/BackgroundEffects/components/BackgroundRenderer';
import { FrameRenderer } from '@components/FrameEffects/components/FrameRenderer';

import type { HostVisualEffectDefinition } from './@types';

export const BACKGROUND_DEFINITION = 'builtin.background';
export const FRAME_DEFINITION = 'builtin.frame';
export const FEEDBACK_DEFINITION = 'builtin.frameFeedback';

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
