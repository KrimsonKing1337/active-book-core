import type { RootState } from '@store';
import type { WindowTarget } from '@store/windows';

export const matchesWindowTarget = (state: RootState, target: WindowTarget | undefined) => {
  if (!target) {
    return false;
  }

  const { main, windows } = state;

  return windows.sessionId === target.sessionId &&
    windows.pageId === main.pageId && windows.activeWindow?.instanceId === target.instanceId;
};
