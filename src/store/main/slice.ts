import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type {
  PageResource,
  PageResourceOutcome,
  PageVisit,
  State,
} from './@types';

export const initialState: State = {
  bookSessionId: null,
  visitSequence: 0,
  visit: null,
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

export const visitIsPreparing = (visit: PageVisit) => {
  return !visit.primaryCommitted || Object.keys(visit.pendingResources).length > 0;
};

const startVisit = (state: State) => {
  if (!state.bookSessionId) {
    return;
  }

  state.visitSequence += 1;
  state.visit = {
    id: state.visitSequence,
    pageId: state.pageId,
    primaryCommitted: false,
    pendingResources: {},
    failedResources: 0,
    reveal: false,
    presentedAt: null,
  };
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
    openBookSession(state, action: PayloadAction<{
      sessionId: string;
      pageIds: string[];
      initialPage: string | number | null;
    }>) {
      const {
        sessionId,
        pageIds,
        initialPage,
      } = action.payload;

      state.bookSessionId = sessionId;
      state.pageIds = pageIds;
      state.showLoader = false;

      const pageId = typeof initialPage === 'number' ? pageIds[initialPage - 1] : initialPage;

      state.pageId = pageId && pageIds.includes(pageId) ? pageId : null;
      startVisit(state);
    },
    closeBookSession(state, action: PayloadAction<string>) {
      if (state.bookSessionId === action.payload) {
        state.bookSessionId = null;
        state.visit = null;
        state.showLoader = false;
      }
    },
    setPrimaryCommitted(state, action: PayloadAction<{
      visitId: number;
      committed: boolean
    }>) {
      const { visitId, committed } = action.payload;
      const visit = state.visit;

      if (visit?.id === visitId && visit.presentedAt === null) {
        visit.primaryCommitted = committed;
        if (!committed) {
          visit.reveal = false;
        }
      }
    },
    registerPageResource(state, action: PayloadAction<PageResource>) {
      const { visitId, resourceId } = action.payload;
      const visit = state.visit;

      if (visit?.id === visitId && visit.presentedAt === null) {
        visit.pendingResources[resourceId] = true;
        visit.reveal = false;
      }
    },
    settlePageResource(state, action: PayloadAction<PageResource & {
      outcome: PageResourceOutcome
    }>) {
      const {
        visitId,
        resourceId,
        outcome,
      } = action.payload;
      const visit = state.visit;

      if (visit?.id === visitId && visit.pendingResources[resourceId] === true) {
        if (outcome === 'failed') {
          visit.failedResources += 1;
        }

        delete visit.pendingResources[resourceId];
      }
    },
    allowPageReveal(state, action: PayloadAction<number>) {
      const visit = state.visit;

      if (visit?.id === action.payload && !state.showLoader && !visitIsPreparing(visit)) {
        visit.reveal = true;
      }
    },
    presentPage(state, action: PayloadAction<{
      visitId: number;
      time: number
    }>) {
      const { visitId, time } = action.payload;
      const visit = state.visit;

      if (visit?.id === visitId && visit.reveal && !state.showLoader && visit.presentedAt === null) {
        visit.presentedAt = time;
      }
    },
    setPage(state, action: PayloadAction<number | string | null>) {
      const target = action.payload;
      const pageId = typeof target === 'number' ? state.pageIds[target - 1] : target;

      const previous = state.pageId;

      if (target === 0 || target === null) {
        state.pageId = null;
      } else if (pageId && state.pageIds.includes(pageId)) {
        state.pageId = pageId;
      }

      if (previous !== state.pageId) {
        startVisit(state);
      }
    },
    setStoryPages(state, action: PayloadAction<string[]>) {
      state.pageIds = action.payload;

      if (state.pageId && !state.pageIds.includes(state.pageId)) {
        state.pageId = state.pageIds[0] ?? null;
        startVisit(state);
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
