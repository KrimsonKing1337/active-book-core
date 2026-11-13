import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { State } from './@types';

export const initialState: State = {
  showLoader: false,
  id: '',
  pageId: null,
  pageIds: [],
  authorComments: 0,
  allPagesSeen: false,
  tableOfContents: [],
  isVibrationAvailable: null,
  isFlashlightAvailable: null,
  flashlightProblems: '',
  isAudioUnlocked: false,
};

const slice = createSlice({
  name: '@main',
  initialState,
  reducers: {
    setShowLoader(state, action: PayloadAction<State['showLoader']>) {
      state.showLoader = action.payload;
    },
    setId(state, action: PayloadAction<State['id']>) {
      state.id = action.payload;
    },
    setPage(state, action: PayloadAction<number | string | null>) {
      const target = action.payload;
      const pageId = typeof target === 'number' ? state.pageIds[target - 1] : target;

      if (target === 0 || target === null) {
        state.pageId = null;
      } else if (pageId && state.pageIds.includes(pageId)) {
        state.pageId = pageId;
      }
    },
    setStoryPages(state, action: PayloadAction<string[]>) {
      state.pageIds = action.payload;

      if (state.pageId && !state.pageIds.includes(state.pageId)) {
        state.pageId = state.pageIds[0] ?? null;
      }
    },
    setAuthorComments(state, action: PayloadAction<State['authorComments']>) {
      state.authorComments = action.payload;
    },
    setTableOfContents(state, action: PayloadAction<State['tableOfContents']>) {
      state.tableOfContents = action.payload;
    },
    setAllPagesSeen(state, action: PayloadAction<State['allPagesSeen']>) {
      state.allPagesSeen = action.payload;
    },
    setIsVibrationAvailable(state, action: PayloadAction<State['isVibrationAvailable']>) {
      state.isVibrationAvailable = action.payload;
    },
    setIsFlashlightAvailable(state, action: PayloadAction<State['isFlashlightAvailable']>) {
      state.isFlashlightAvailable = action.payload;
    },
    setFlashlightProblems(state, action: PayloadAction<State['flashlightProblems']>) {
      state.flashlightProblems = action.payload;
    },
    setIsAudioUnlocked(state, action: PayloadAction<State['isAudioUnlocked']>) {
      state.isAudioUnlocked = action.payload;
    },
  },
});

export const { reducer, actions } = slice;
