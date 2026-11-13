import type { PropsWithChildren } from 'react';


import { StrictMode } from 'react';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';
import { windowsActions } from '@store/windows';

import type { StoryDialogProps } from '@components/StoryDialog';

import { StoryRegionsProvider } from '@components/StoryRegionsProvider';
import { StoryWindowSessionContext } from '@components/StoryWindowHost/context';

import { StoryConfirmDialog } from '../StoryConfirmDialog';

let mockConfirm: (() => void) | undefined;

// Isolate confirmation/ownership logic; real Radix focus and dismissal are covered in Chromium.
jest.mock('@components/StoryDialog', () => ({
  StoryDialog: ({ isOpen, children }: StoryDialogProps) => {
    if (!isOpen) {
      return null;
    }

    return <div>{children}</div>;
  },
}));

jest.mock('@components/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: PropsWithChildren<{
    onClick: () => void;
    disabled: boolean;
  }>) => {
    if (children === 'OK') {
      mockConfirm = onClick;
    }

    return <button disabled={disabled} onClick={onClick}>{children}</button>;
  },
}));

const owner = { sessionId: 'confirm-unit', pageId: 'page-a' };

beforeEach(() => {
  jest.useFakeTimers();
  store.dispatch(mainActions.setStoryPages(['page-a']));
  store.dispatch(mainActions.setPage('page-a'));
  store.dispatch(windowsActions.synchronizeSession(owner));
});

afterEach(() => {
  cleanup();
  act(() => jest.runAllTicks());
  store.dispatch(windowsActions.endSession(owner.sessionId));
  jest.useRealTimers();
});

const open = () => {
  const action = windowsActions.open({
    ...owner,
    kind: 'dialog',
    contentId: 'notice',
    canClose: false,
  });
  store.dispatch(action);

  return { sessionId: owner.sessionId, instanceId: action.payload.instanceId };
};

const wrapper = ({ children }: PropsWithChildren) => (
  <StrictMode>
    <StoreProvider>
      <StoryWindowSessionContext value={owner.sessionId}>
        <StoryRegionsProvider>{children}</StoryRegionsProvider>
      </StoryWindowSessionContext>
    </StoreProvider>
  </StrictMode>
);

test('zero-delay confirmation is immediately usable and StrictMode replay preserves the active owner', () => {
  const target = open();
  const confirm = jest.fn();
  const view = render(<StoryConfirmDialog title="Notice" target={target} onConfirm={confirm} />, { wrapper });
  act(() => jest.runAllTicks());

  expect(store.getState().windows.activeWindow?.instanceId).toBe(target.instanceId);
  expect(store.getState().windows.activeWindow?.canClose).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  expect(confirm).toHaveBeenCalledTimes(1);
  view.unmount();
  act(() => jest.runAllTicks());
  expect(store.getState().windows.activeWindow).toBeNull();
});

test('a mandatory warning unlocks confirmation without ever granting user dismissal', () => {
  const target = open();
  const confirm = jest.fn();
  render(
    <StoryConfirmDialog
      title="Notice"
      target={target}
      confirmationDelayMs={2000}
      allowDismiss={false}
      onConfirm={confirm}
    />,
    { wrapper },
  );
  fireEvent.click(screen.getByRole('button', { name: 'OK (2)' }));
  expect(confirm).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(2000));
  expect(store.getState().windows.activeWindow?.canClose).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  expect(confirm).toHaveBeenCalledTimes(1);
});

test('an eligible but retired confirm callback cannot run business effects or close its successor', () => {
  const first = open();
  const confirm = jest.fn();
  const view = render(<StoryConfirmDialog title="Notice" target={first} onConfirm={confirm} />, { wrapper });
  const staleConfirm = mockConfirm;
  let second = first;
  act(() => {
    second = open();
  });
  view.rerender(
    <StoryConfirmDialog
      title="Notice"
      target={second}
      confirmationDelayMs={2000}
      onConfirm={confirm}
    />,
  );
  act(() => staleConfirm?.());

  expect(confirm).not.toHaveBeenCalled();
  expect(store.getState().windows.activeWindow?.instanceId).toBe(second.instanceId);
  expect(store.getState().windows.activeWindow?.canClose).toBe(false);
});
