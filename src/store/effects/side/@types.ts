import type { SideEffect, SideShadowItem, SideTextItem } from 'hooks/effects/side/@types';

export type SideEffects = Record<string, SideEffect>;

export type State = {
  effects: SideEffects;
};

export type UpdateSideShadow = {
  effectId: string;
  shadowId: string;
  changes: Partial<SideShadowItem>;
};

export type UpdateSideText = {
  effectId: string;
  textId: string;
  changes: Partial<SideTextItem>;
};
