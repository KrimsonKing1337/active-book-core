import type { RootState } from '@store';

import { visitIsPreparing } from './slice';

const isPending = (state: RootState) => {
  const { visit } = state.main;

  return visit !== null && visit.presentedAt === null && visitIsPreparing(visit);
};

export const selectors = {
  isPending,
  bookSessionId: (state: RootState) => state.main.bookSessionId,
  visit: (state: RootState) => state.main.visit,
  visitId: (state: RootState) => state.main.visit?.id ?? null,
  presentedAt: (state: RootState) => state.main.visit?.presentedAt ?? null,
  isPagePresented: ({ main }: RootState) => {
    return !main.showLoader && (!main.visit || main.visit.presentedAt !== null);
  },

  showLoader: (state: RootState) => state.main.showLoader,

  id: (state: RootState) => state.main.id,
  pageId: (state: RootState) => state.main.pageId,
  page: (state: RootState) => state.main.pageIds.indexOf(state.main.pageId ?? '') + 1,
  pages: (state: RootState) => state.main.pageIds.length,
  authorComments: (state: RootState) => state.main.authorComments,
  allPagesSeen: (state: RootState) => state.main.allPagesSeen,
  tableOfContents: (state: RootState) => state.main.tableOfContents,
  isVibrationAvailable: (state: RootState) => state.main.isVibrationAvailable,
  isFlashlightAvailable: (state: RootState) => state.main.isFlashlightAvailable,
  flashlightProblems: (state: RootState) => state.main.flashlightProblems,
  isAudioUnlocked: (state: RootState) => state.main.isAudioUnlocked,
};
