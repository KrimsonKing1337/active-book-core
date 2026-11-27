import type { RootState } from '@store';

import { visitIsPreparing } from './slice';

const isPending = ({ main }: RootState) => {
  const { visit } = main;

  if (!visit) {
    return false;
  }

  if (visit.presentedAt !== null) {
    return false;
  }

  return visitIsPreparing(visit);
};

const isPagePresented = ({ main }: RootState) => {
  const { showLoader, visit } = main;

  if (showLoader) {
    return false;
  }

  if (!visit) {
    return true;
  }

  return visit.presentedAt !== null;
};

const page = ({ main }: RootState) => {
  const pageId = main.pageId ?? '';
  const index = main.pageIds.indexOf(pageId);

  return index + 1;
};

export const selectors = {
  page,
  isPending,
  isPagePresented,
  bookSessionId: (state: RootState) => state.main.bookSessionId,
  visit: (state: RootState) => state.main.visit,
  visitId: (state: RootState) => state.main.visit?.id ?? null,
  presentedAt: (state: RootState) => state.main.visit?.presentedAt ?? null,
  showLoader: (state: RootState) => state.main.showLoader,
  id: (state: RootState) => state.main.id,
  pageId: (state: RootState) => state.main.pageId,
  pages: (state: RootState) => state.main.pageIds.length,
  authorComments: (state: RootState) => state.main.authorComments,
  allPagesSeen: (state: RootState) => state.main.allPagesSeen,
  tableOfContents: (state: RootState) => state.main.tableOfContents,
  isVibrationAvailable: (state: RootState) => state.main.isVibrationAvailable,
  isFlashlightAvailable: (state: RootState) => state.main.isFlashlightAvailable,
  flashlightProblems: (state: RootState) => state.main.flashlightProblems,
  isAudioUnlocked: (state: RootState) => state.main.isAudioUnlocked,
};
