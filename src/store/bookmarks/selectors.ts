import type { RootState } from '@store';

export const selectors = {
  bookmarks: (state: RootState) => state.bookmarks.bookmarks,
};
