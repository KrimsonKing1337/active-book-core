import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { BackgroundEffect } from '@hooks/effects/background/@types';

import type { BackgroundEffects, State } from './@types';

export const initialState: State = {
  effects: {},
};

const slice = createSlice({
  name: '@effects/background',
  initialState,
  reducers: {
    setEffect(state, action: PayloadAction<BackgroundEffect>) {
      state.effects[action.payload.id] = action.payload;
    },
    deleteEffect(state, action: PayloadAction<string>) {
      delete state.effects[action.payload];
    },
    setEffects(state, action: PayloadAction<BackgroundEffects>) {
      state.effects = action.payload;
    },
  },
});

export const { actions, reducer } = slice;
