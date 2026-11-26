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
  if (!visit.primaryCommitted) {
    return true;
  }

  return Object.keys(visit.pendingResources).length > 0;
};

const resolvePageId = (
  pageIds: string[],
  target: string | number | null,
) => {
  if (typeof target === 'number') {
    return pageIds[target - 1];
  }

  return target;
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

type OpenBookSessionPayload = {
  sessionId: string;
  pageIds: string[];
  initialPage: string | number | null;
};

type SetPrimaryCommittedPayload = {
  visitId: number;
  committed: boolean;
};

type SettlePageResourcePayload = PageResource & {
  outcome: PageResourceOutcome;
};

type PresentPagePayload = {
  visitId: number;
  time: number;
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
    openBookSession(state, action: PayloadAction<OpenBookSessionPayload>) {
      const {
        sessionId,
        pageIds,
        initialPage,
      } = action.payload;

      state.bookSessionId = sessionId;
      state.pageIds = pageIds;
      state.showLoader = false;
      state.pageId = null;

      const pageId = resolvePageId(pageIds, initialPage);

      if (pageId && pageIds.includes(pageId)) {
        state.pageId = pageId;
      }

      startVisit(state);
    },
    closeBookSession(state, action: PayloadAction<string>) {
      if (state.bookSessionId !== action.payload) {
        return;
      }

      state.bookSessionId = null;
      state.visit = null;
      state.showLoader = false;
    },
    setPrimaryCommitted(state, action: PayloadAction<SetPrimaryCommittedPayload>) {
      const { visitId, committed } = action.payload;
      const { visit } = state;

      if (!visit || visit.id !== visitId) {
        return;
      }

      if (visit.presentedAt !== null) {
        return;
      }

      visit.primaryCommitted = committed;

      if (!committed) {
        visit.reveal = false;
      }
    },
    registerPageResource(state, action: PayloadAction<PageResource>) {
      const { visitId, resourceId } = action.payload;
      const { visit } = state;

      if (!visit || visit.id !== visitId) {
        return;
      }

      if (visit.presentedAt !== null) {
        return;
      }

      visit.pendingResources[resourceId] = true;
      visit.reveal = false;
    },
    settlePageResource(state, action: PayloadAction<SettlePageResourcePayload>) {
      const {
        visitId,
        resourceId,
        outcome,
      } = action.payload;

      const { visit } = state;

      if (!visit || visit.id !== visitId) {
        return;
      }

      if (!visit.pendingResources[resourceId]) {
        return;
      }

      if (outcome === 'failed') {
        visit.failedResources += 1;
      }

      delete visit.pendingResources[resourceId];
    },
    allowPageReveal(state, action: PayloadAction<number>) {
      const { visit, showLoader } = state;

      if (!visit || visit.id !== action.payload) {
        return;
      }

      if (showLoader) {
        return;
      }

      if (visitIsPreparing(visit)) {
        return;
      }

      visit.reveal = true;
    },
    presentPage(state, action: PayloadAction<PresentPagePayload>) {
      const { visitId, time } = action.payload;
      const { visit, showLoader } = state;

      if (!visit || visit.id !== visitId) {
        return;
      }

      if (!visit.reveal || showLoader) {
        return;
      }

      if (visit.presentedAt !== null) {
        return;
      }

      visit.presentedAt = time;
    },
    setPage(state, action: PayloadAction<number | string | null>) {
      const target = action.payload;
      const previousPageId = state.pageId;
      const pageId = resolvePageId(state.pageIds, target);

      if (target === 0 || target === null) {
        state.pageId = null;
      } else if (pageId && state.pageIds.includes(pageId)) {
        state.pageId = pageId;
      }

      if (previousPageId !== state.pageId) {
        startVisit(state);
      }
    },
    setStoryPages(state, action: PayloadAction<string[]>) {
      state.pageIds = action.payload;

      if (!state.pageId) {
        return;
      }

      if (state.pageIds.includes(state.pageId)) {
        return;
      }

      state.pageId = state.pageIds[0] ?? null;

      startVisit(state);
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
