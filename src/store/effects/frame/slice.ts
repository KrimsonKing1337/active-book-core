import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { FrameEffect } from '@hooks/effects/frame/@types';

import type {
  FrameEffects,
  State,
  UpdateFrameShadow,
  UpdateFrameText,
} from './@types';

export const initialState: State = {
  effects: {},
};

const slice = createSlice({
  name: '@effects/frame',
  initialState,
  reducers: {
    setEffect(state, action: PayloadAction<FrameEffect>) {
      state.effects[action.payload.id] = action.payload;
    },
    deleteEffect(state, action: PayloadAction<string>) {
      delete state.effects[action.payload];
    },
    // Сага объединяет изменения и отправляет готовый эффект через setEffect.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateShadow(_state, _action: PayloadAction<UpdateFrameShadow>) {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateText(_state, _action: PayloadAction<UpdateFrameText>) {},
    setEffects(state, action: PayloadAction<FrameEffects>) {
      state.effects = action.payload;
    },
  },
});

export const { actions, reducer } = slice;
