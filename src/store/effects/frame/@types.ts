import type { FrameEffect, FrameShadowItem, FrameTextItem } from '@hooks/effects/frame/@types';

export type FrameEffects = Record<string, FrameEffect>;

export type State = {
  effects: FrameEffects;
};

export type UpdateFrameShadow = {
  effectId: string;
  shadowId: string;
  changes: Partial<FrameShadowItem>;
};

export type UpdateFrameText = {
  effectId: string;
  textId: string;
  changes: Partial<FrameTextItem>;
};
