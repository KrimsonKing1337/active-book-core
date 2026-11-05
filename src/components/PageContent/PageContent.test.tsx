import { useEffect } from 'react';

import { act, render } from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { segmentsActions } from '@store/segments';

import { PageContent } from './PageContent';

test('keyed content cancels its own pending work, timers and listeners while the shell survives', async () => {
  jest.useFakeTimers();
  const loaded = jest.fn();
  const tick = jest.fn();
  const event = jest.fn();
  const aborts = jest.fn();
  const pending: (() => void)[] = [];

  const Resources = () => {
    useEffect(() => {
      const controller = new AbortController();
      const timer = setInterval(tick, 100);
      const load = new Promise<void>((resolve) => pending.push(resolve));

      void load.then(() => {
        if (!controller.signal.aborted) {
          loaded();
        }
      });
      document.addEventListener('page-resource', event);

      return () => {
        controller.abort();
        aborts();
        clearInterval(timer);
        document.removeEventListener('page-resource', event);
      };
    }, []);

    return <p>Page resources</p>;
  };

  const Book = ({ pageId }: {
    pageId: string
  }) => (
    <StoreProvider>
      <main data-testid="shell">
        <PageContent key={pageId}>
          <Resources />
        </PageContent>
      </main>
    </StoreProvider>
  );
  const result = render(<Book pageId="one" />);
  const shell = result.getByTestId('shell');
  store.dispatch(segmentsActions.setSegmentsCount(9));
  result.rerender(<Book pageId="two" />);
  expect(result.getByTestId('shell')).toBe(shell);
  expect(aborts).toHaveBeenCalledTimes(1);
  expect(store.getState().segments.count).toBe(0);
  await act(async () => pending[0]());
  expect(loaded).not.toHaveBeenCalled();
  await act(async () => pending[1]());
  expect(loaded).toHaveBeenCalledTimes(1);
  act(() => {
    jest.advanceTimersByTime(100);
    document.dispatchEvent(new Event('page-resource'));
  });
  expect(tick).toHaveBeenCalledTimes(1);
  expect(event).toHaveBeenCalledTimes(1);
  result.unmount();
  expect(aborts).toHaveBeenCalledTimes(2);
  act(() => {
    jest.advanceTimersByTime(1000);
    document.dispatchEvent(new Event('page-resource'));
  });
  expect(tick).toHaveBeenCalledTimes(1);
  expect(event).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
