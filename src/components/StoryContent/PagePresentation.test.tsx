import {
  type PropsWithChildren,
  StrictMode,
  use,
  useCallback,
} from 'react';

import {
  type RenderResult,
  act,
  render,
  waitFor,
} from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { mainActions, mainSelectors } from '@store/main';

import { BookPresentationContext } from '@hooks/pagePresentation/context';
import { type SettlePageResource, usePageResource } from '@hooks/pagePresentation/usePageResource';

import { StoryContent } from './StoryContent';

const read = () => store.getState().main;

const open = (sessionId = 'book') => store.dispatch(mainActions.openBookSession({
  sessionId,
  pageIds: ['first', 'second'],
  initialPage: 'first',
}));

const view = (children: React.ReactNode, session = 'book') => (
  <StrictMode>
    <StoreProvider>
      <BookPresentationContext value={session}>
        <StoryContent>
          {children}
        </StoryContent>
      </BookPresentationContext>
    </StoreProvider>
  </StrictMode>
);

const Resource = ({ subscribe }: {
  subscribe: (settle: SettlePageResource) => void;
}) => {
  usePageResource(subscribe);

  return null;
};

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
  open();
});

afterEach(() => {
  const { bookSessionId } = read();

  if (bookSessionId) {
    store.dispatch(mainActions.closeBookSession(bookSessionId));
  }

  jest.useRealTimers();
});

test('a blocked Suspense registers its resources before the loader can reveal the page', async () => {
  let mountPrimary!: () => void;
  const gate = new Promise<void>((resolve) => {
    mountPrimary = resolve;
  });
  const callbacks: SettlePageResource[] = [];

  const Primary = ({ children }: PropsWithChildren) => {
    use(gate);
    const subscribe = useCallback((settle: SettlePageResource) => {
      callbacks.push(settle);
    }, []);

    return (
      <>
        <Resource subscribe={subscribe} />
        {children}
      </>
    );
  };

  let rendered!: RenderResult;
  await act(async () => {
    rendered = render(view(<Primary>Ready page</Primary>));
  });
  const { container, unmount } = rendered;
  await act(async () => jest.advanceTimersByTime(250));
  expect(read().showLoader).toBe(true);
  expect(read().visit?.primaryCommitted).toBe(false);

  await act(async () => mountPrimary());
  await waitFor(() => expect(callbacks.length).toBeGreaterThan(0));
  const [resourceId] = Object.keys(read().visit?.pendingResources ?? {});
  expect(resourceId).toBeDefined();
  expect(read().visit?.presentedAt).toBeNull();

  await act(async () => {
    const settle = callbacks.at(-1)!;

    settle('failed');
    settle('failed');
    jest.advanceTimersByTime(199);
  });
  expect(mainSelectors.isPending(store.getState())).toBe(false);
  expect(read().visit?.failedResources).toBe(1);
  expect(read().showLoader).toBe(true);
  expect(container.querySelector('[data-story-content]')).toHaveAttribute('inert');
  expect(read().visit?.presentedAt).toBeNull();

  await act(async () => jest.advanceTimersByTime(1));
  expect(read().visit?.presentedAt).toEqual(expect.any(Number));
  expect(container.querySelector('[data-story-content]')).not.toHaveAttribute('inert');
  unmount();
});

test('cancelled, repeated and displaced registrations cannot complete a future visit', async () => {
  const first: SettlePageResource[] = [];
  const replacement: SettlePageResource[] = [];
  const oldSubscribe = (settle: SettlePageResource) => {
    first.push(settle);
  };
  const nextSubscribe = (settle: SettlePageResource) => {
    replacement.push(settle);
  };
  const { rerender, unmount } = render(view(<Resource subscribe={oldSubscribe} />));
  const originalId = read().visit?.id ?? 0;
  expect(Object.keys(read().visit!.pendingResources)).toHaveLength(1);

  await act(async () => store.dispatch(mainActions.setPage('second')));
  await act(async () => store.dispatch(mainActions.setPage('first')));
  expect(read().visit!.id).toBeGreaterThan(originalId);
  expect(read().visit?.presentedAt).toBeNull();

  rerender(view(<Resource subscribe={nextSubscribe} />));
  await act(async () => first.forEach((settle) => settle('failed')));
  expect(Object.keys(read().visit!.pendingResources)).toHaveLength(1);
  expect(read().visit?.failedResources).toBe(0);
  expect(read().visit?.presentedAt).toBeNull();

  await act(async () => rerender(view(<p>Resource removed</p>)));
  const presentedAt = read().visit?.presentedAt;
  expect(presentedAt).toEqual(expect.any(Number));
  await act(async () => replacement.forEach((settle) => settle('failed')));
  expect(read().visit?.failedResources).toBe(0);
  expect(read().visit?.presentedAt).toBe(presentedAt);

  await act(async () => open('new-book'));
  expect(read().visit?.presentedAt).toBeNull();
  await act(async () => rerender(view(<p>New book, no resources</p>, 'new-book')));
  expect(read().visit?.presentedAt).toEqual(expect.any(Number));
  unmount();
  act(() => store.dispatch(mainActions.closeBookSession('new-book')));
  expect(read().visit).toBeNull();
});
