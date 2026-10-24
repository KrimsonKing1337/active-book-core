import type { SideEffect } from 'hooks/effects/side/@types';

export type SideEffects = Record<string, SideEffect>;

export type State = {
  effects: SideEffects;
};
