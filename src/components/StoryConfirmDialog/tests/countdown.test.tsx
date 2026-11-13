import type { PropsWithChildren } from 'react';

import { StrictMode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { useConfirmationCountdown } from '../hooks';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const strict = ({ children }: PropsWithChildren) => <StrictMode>{children}</StrictMode>;

test('no delay is ready immediately without scheduling a timer', () => {
  const { result } = renderHook(() => useConfirmationCountdown({ instanceId: 'a', delayMs: 0 }));

  expect(result.current).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('counts up to the exact deadline, including fractional seconds', () => {
  const { result } = renderHook(() => useConfirmationCountdown({ instanceId: 'a', delayMs: 2500 }));

  expect(result.current).toBe(3);
  act(() => jest.advanceTimersByTime(1000));
  expect(result.current).toBe(2);
  act(() => jest.advanceTimersByTime(1499));
  expect(result.current).toBe(1);
  act(() => jest.advanceTimersByTime(1));
  expect(result.current).toBe(0);
  expect(jest.getTimerCount()).toBe(0);
});

test('a new instance starts its own deadline and rejects an already queued old tick', () => {
  const timeout = jest.spyOn(globalThis, 'setTimeout');
  const { result, rerender } = renderHook(useConfirmationCountdown, {
    initialProps: { instanceId: 'a', delayMs: 2000 },
  });
  const staleTick = timeout.mock.calls[0][0];

  act(() => jest.advanceTimersByTime(1500));
  rerender({ instanceId: 'b', delayMs: 2000 });
  expect(result.current).toBe(2);
  act(() => {
    if (typeof staleTick === 'function') {
      staleTick();
    }
    jest.advanceTimersByTime(500);
  });
  expect(result.current).toBe(2);
  act(() => jest.advanceTimersByTime(1500));
  expect(result.current).toBe(0);
  timeout.mockRestore();
});

test('changing delay on the same instance cannot inherit an unlocked countdown', () => {
  const { result, rerender } = renderHook(useConfirmationCountdown, {
    initialProps: { instanceId: 'a', delayMs: 0 },
  });

  rerender({ instanceId: 'a', delayMs: 2000 });
  expect(result.current).toBe(2);
  act(() => jest.advanceTimersByTime(2000));
  expect(result.current).toBe(0);
});

test('StrictMode keeps one timer and closing/reopening has no inherited readiness', () => {
  const {
    result,
    rerender,
    unmount,
  } = renderHook(useConfirmationCountdown, {
    initialProps: { instanceId: 'a', delayMs: 2000 },
    wrapper: strict,
  });

  expect(jest.getTimerCount()).toBe(1);
  act(() => jest.advanceTimersByTime(2000));
  expect(result.current).toBe(0);
  rerender({ instanceId: 'b', delayMs: 2000 });
  expect(result.current).toBe(2);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});
