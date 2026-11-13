import type { RootState } from '@store';
import type { WindowTarget } from '@store/windows';

type Target = WindowTarget | undefined;

export const matchesWindowTarget = (state: RootState, target: Target) => {
  if (!target) {
    return false;
  }

  const { main, windows } = state;

  const sessionIdIsEqual = windows.sessionId === target.sessionId;
  const pageIdIsEqual = windows.pageId === main.pageId;
  const activeWindowInstanceIdIsEqual = windows.activeWindow?.instanceId === target.instanceId;

  return sessionIdIsEqual && pageIdIsEqual && activeWindowInstanceIdIsEqual;
};
