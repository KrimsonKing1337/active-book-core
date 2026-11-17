import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { State } from './@types';

export const initialState: State = {
  count: 0,
};

const slice = createSlice({
  name: '@counter',
  initialState,
  reducers: {
    setCount(state, action: PayloadAction<State['count']>) {
      state.count = action.payload;
    },
     
    increment(_state) {},
     
    decrement(_state) {},
  },
});

export const { reducer, actions } = slice;
