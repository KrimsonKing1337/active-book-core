import type { RootState } from '@store';

export const selectors = {
  activeWindow: (state: RootState) => state.windows.activeWindow,
  sessionId: (state: RootState) => state.windows.sessionId,
};
