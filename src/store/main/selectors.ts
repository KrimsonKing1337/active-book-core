import type { RootState } from '@store';

import { effectsSelectors } from '@store/effects/common';

const isPending = (state: RootState) => {
  return effectsSelectors.isDotLottieLoading(state)
    || effectsSelectors.isImagesLoading(state)
    || effectsSelectors.isVideosLoading(state)
    || effectsSelectors.isAudiosLoading(state);
};

export const selectors = {
  isPending,
  showLoader: (state: RootState) => state.main.showLoader,

  id: (state: RootState) => state.main.id,
  pageId: (state: RootState) => state.main.pageId,
  page: (state: RootState) => state.main.pageIds.indexOf(state.main.pageId ?? '') + 1,
  pages: (state: RootState) => state.main.pageIds.length,
  authorComments: (state: RootState) => state.main.authorComments,
  allPagesSeen: (state: RootState) => state.main.allPagesSeen,
  tableOfContents: (state: RootState) => state.main.tableOfContents,
  menuActiveState: (state: RootState) => state.main.menuActiveState,
  isVibrationAvailable: (state: RootState) => state.main.isVibrationAvailable,
  isFlashlightAvailable: (state: RootState) => state.main.isFlashlightAvailable,
  flashlightProblems: (state: RootState) => state.main.flashlightProblems,
  isAudioUnlocked: (state: RootState) => state.main.isAudioUnlocked,
};
