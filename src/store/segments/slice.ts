import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type {
  State,
  Segment,
  Segments,
} from './@types';

export const initialState: State = {
  segments: {},
  lastActiveId: '',
  // сколько компонентов Segment на странице было проинициализировано
  count: 0,
};

const slice = createSlice({
  name: '@segments',
  initialState,
  reducers: {
    setSegments(state, action: PayloadAction<Segments>) {
      state.segments = action.payload;
    },
    setLastActiveId(state, action: PayloadAction<string>) {
      state.lastActiveId = action.payload;
    },
    setSegmentsCount(state, action: PayloadAction<number>) {
      state.count = action.payload;
    },

    incrementSegmentsCount() {},
     
    setSegment(_state, _action: PayloadAction<Segment>) {},
     
    removeSegment(_state, _action: PayloadAction<string>) {},

    reset() {
      return initialState;
    },
  },
});

export const { reducer, actions } = slice;
