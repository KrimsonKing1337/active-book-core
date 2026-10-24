import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { SideEffect } from 'hooks/effects/side/@types';

import type { SideEffects, State } from './@types';

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
    setEffects(state, action: PayloadAction<SideEffects>) {
      state.effects = action.payload;
    },
  },
});

export const { actions, reducer } = slice;
