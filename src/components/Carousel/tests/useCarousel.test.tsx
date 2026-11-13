import { StrictMode } from 'react';

import { act, renderHook } from '@testing-library/react';

import { useCarousel } from '../hooks';

import { embla } from './embla';

jest.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: () => [() => {}, jest.requireActual('./embla').emblaApi],
}));

beforeEach(() => embla.reset());

test('reports initialization and actual selection changes, including reInit', () => {
  const onSelect = jest.fn();
  const { result, rerender } = renderHook(() => useCarousel(onSelect));

  expect(onSelect.mock.calls).toEqual([[0]]);
  act(() => result.current.next());
  expect(onSelect.mock.calls).toEqual([[0], [1]]);
  act(() => embla.emit('select'));
  act(() => embla.emit('reInit'));
  rerender();
  expect(onSelect.mock.calls).toEqual([[0], [1]]);

  act(() => {
    embla.index = 0;
    embla.count = 1;
    embla.emit('reInit');
  });
  expect(onSelect.mock.calls).toEqual([
    [0],
    [1],
    [0],
  ]);
  expect(result.current.navigation).toEqual({
    selected: 0,
    canPrevious: false,
    canNext: false,
  });
});

test('uses the latest committed callback without replaying selection or resubscribing', () => {
  const first = jest.fn();
  const second = jest.fn();
  const { result, rerender } = renderHook(({ callback }) => useCarousel(callback), {
    initialProps: { callback: first },
  });
  const subscription = [...embla.listeners.select][0];
  rerender({ callback: second });

  expect(second).not.toHaveBeenCalled();
  expect([...embla.listeners.select]).toEqual([subscription]);
  act(() => result.current.next());
  expect(first.mock.calls).toEqual([[0]]);
  expect(second.mock.calls).toEqual([[1]]);
});

test('StrictMode has one listener per event, one initial notification and complete cleanup', () => {
  const onSelect = jest.fn();
  const { result, unmount } = renderHook(() => useCarousel(onSelect), { wrapper: StrictMode });

  expect(onSelect.mock.calls).toEqual([[0]]);
  expect(embla.listeners.select.size).toBe(1);
  expect(embla.listeners.reInit.size).toBe(1);
  act(() => result.current.next());
  expect(onSelect.mock.calls).toEqual([[0], [1]]);
  unmount();
  expect(embla.listeners.select.size).toBe(0);
  expect(embla.listeners.reInit.size).toBe(0);
  act(() => embla.emit('select'));
  expect(onSelect).toHaveBeenCalledTimes(2);
});

test('an empty Embla has no selected slide to report', () => {
  embla.count = 0;
  const onSelect = jest.fn();
  renderHook(() => useCarousel(onSelect));
  expect(onSelect).not.toHaveBeenCalled();

  act(() => {
    embla.count = 1;
    embla.emit('reInit');
  });
  expect(onSelect.mock.calls).toEqual([[0]]);
});
