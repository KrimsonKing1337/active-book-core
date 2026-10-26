import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { SideEffect, SideShadowItem, SideTextItem } from 'hooks/effects/side/@types';

import type { SideEffects, State } from './@types';

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

export const initialState: State = {
  effects: {},
};

const slice = createSlice({
  name: '@effects/side',
  initialState,
  reducers: {
    setEffect(state, action: PayloadAction<SideEffect>) {
      state.effects[action.payload.id] = action.payload;
    },
    deleteEffect(state, action: PayloadAction<string>) {
      delete state.effects[action.payload];
    },
    updateShadow(state, action: PayloadAction<UpdateSideShadow>) {
      const { effectId, shadowId, changes } = action.payload;
      const shadow = state.effects[effectId]?.shadow;

      if (!shadow || shadow.id !== shadowId) {
        return;
      }

      const style = changes.style
        ? { ...shadow.style, ...changes.style }
        : shadow.style;

      const animation = changes.animation
        ? { ...shadow.animation, ...changes.animation }
        : shadow.animation;

      Object.assign(shadow, changes);

      if (changes.style) {
        shadow.style = style;
      }

      if (changes.animation) {
        shadow.animation = animation;
      }
    },
    updateText(state, action: PayloadAction<UpdateSideText>) {
      const { effectId, textId, changes } = action.payload;
      const item = state.effects[effectId]?.text;

      if (!item || item.id !== textId) {
        return;
      }

      const style = changes.style
        ? { ...item.style, ...changes.style }
        : item.style;

      const animation = changes.animation
        ? { ...item.animation, ...changes.animation }
        : item.animation;

      Object.assign(item, changes);

      if (changes.style) {
        item.style = style;
      }

      if (changes.animation) {
        item.animation = animation;
      }
    },
    setEffects(state, action: PayloadAction<SideEffects>) {
      state.effects = action.payload;
    },
  },
});

export const { actions, reducer } = slice;
