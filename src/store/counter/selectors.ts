import type { RootState } from '../store';

export const selectors = {
  count: (state: RootState) => state.counter.count,
};
