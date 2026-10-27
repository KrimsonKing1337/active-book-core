import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { SideEffect } from '@hooks/effects/side/@types';

import type {
  SideEffects,
  State,
  UpdateSideShadow,
  UpdateSideText,
} from './@types';

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
    // Сага объединяет изменения и отправляет готовый эффект через setEffect.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateShadow(_state, _action: PayloadAction<UpdateSideShadow>) {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateText(_state, _action: PayloadAction<UpdateSideText>) {},
    setEffects(state, action: PayloadAction<SideEffects>) {
      state.effects = action.payload;
    },
  },
});

export const { actions, reducer } = slice;
