import { act, render } from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';
import { windowsActions } from '@store/windows';

import { StoryRegionsProvider } from '@components/StoryRegionsProvider';

import { StoryWindowHost } from '../StoryWindowHost';
import { StoryWindowSessionContext } from '../context';

test('never resolves page A content against page B before the session effect synchronizes', () => {
  store.dispatch(mainActions.setStoryPages(['page-a', 'page-b']));
  store.dispatch(mainActions.setPage('page-a'));
  const owner = { sessionId: 'intermediate-state-test', pageId: 'page-a' };
  store.dispatch(windowsActions.synchronizeSession(owner));
  store.dispatch(windowsActions.open({ ...owner, contentId: 'only-in-a' }));
  const resolveContent = jest.fn(() => ({ title: 'A' }));

  const view = render(
    <StoreProvider>
      <StoryWindowSessionContext value={owner.sessionId}>
        <StoryRegionsProvider>
          <StoryWindowHost resolveContent={resolveContent} />
        </StoryRegionsProvider>
      </StoryWindowSessionContext>
    </StoreProvider>,
  );

  expect(resolveContent).toHaveBeenCalledWith('only-in-a');
  resolveContent.mockClear();

  // Deliberately omit BookSession: its synchronizing effect must NOT run in this intermediate state.
  act(() => {
    store.dispatch(mainActions.setPage('page-b'));
  });

  expect(store.getState().main.pageId).toBe('page-b');
  expect(store.getState().windows.pageId).toBe('page-a');
  expect(store.getState().windows.activeWindow?.contentId).toBe('only-in-a');
  expect(resolveContent).not.toHaveBeenCalled();
  view.unmount();
  store.dispatch(windowsActions.endSession(owner.sessionId));
});
