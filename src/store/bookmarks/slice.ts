import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { State } from './@types';

const initialState: State = {
  bookmarks: [],
};

const slice = createSlice({
  name: '@bookmarks',
  initialState,
  reducers: {
    setBookmarks(state, action: PayloadAction<State['bookmarks']>) {
      state.bookmarks = action.payload;
    },
  },
});

export const { actions, reducer } = slice;
