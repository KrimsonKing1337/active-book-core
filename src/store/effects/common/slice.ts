import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { State, VideoCurrentTime } from './@types';

export const initialState: State = {
  inverseColorIsActive: false,

  videosCurrentTime: {},
};

const slice = createSlice({
  name: '@effects/common',
  initialState,
  reducers: {
    setInverseColorActiveState(state, action: PayloadAction<State['inverseColorIsActive']>) {
      state.inverseColorIsActive = action.payload;
    },

    setVideoCurrentTime(state, action: PayloadAction<VideoCurrentTime>) {
      const { id, currentTime } = action.payload;

      state.videosCurrentTime = {
        ...state.videosCurrentTime,
        [id]: currentTime,
      };
    },
    setVideosCurrentTime(state, action: PayloadAction<State['videosCurrentTime']>) {
      state.videosCurrentTime = action.payload;
    },
  },
});

export const { actions, reducer } = slice;
