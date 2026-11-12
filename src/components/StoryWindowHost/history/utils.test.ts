import type { HistoryMarker } from './@types';

import {
  isSamePair,
  isSamePosition,
  markerKey,
  readMarker,
  withMarker,
} from './utils';

const base: HistoryMarker = {
  version: 1,
  sessionId: 'reader',
  pairId: 'pair',
  position: 'base',
};

test.each([
  null,
  1,
  'guard',
  {},
  { [markerKey]: null },
  { [markerKey]: {} },
  { [markerKey]: { ...base, version: 2 } },
  { [markerKey]: { ...base, sessionId: '' } },
  { [markerKey]: { ...base, sessionId: 1 } },
  { [markerKey]: { ...base, pairId: '' } },
  { [markerKey]: { ...base, position: 'restore' } },
])('ignores malformed or unrelated history state: %p', (state) => {
  expect(readMarker(state)).toBeNull();
});

test('reads only navigation metadata, never arbitrary restoration fields', () => {
  expect(readMarker({ [markerKey]: { ...base, contentId: 'never restore' } })).toEqual(base);
  const guard: HistoryMarker = { ...base, position: 'guard' };
  expect(readMarker(withMarker(null, guard))).toEqual(guard);
});

test('writing a marker preserves host fields without mutating the original state', () => {
  const host = {
    router: { index: 3 },
    external: 'kept',
    [markerKey]: 'old',
  };
  const updated = withMarker(host, base);

  expect(updated).toEqual({ ...host, [markerKey]: base });
  expect(host[markerKey]).toBe('old');
  expect(withMarker('no fields', base)).toEqual({ [markerKey]: base });
});

test('compensation requires both reader ownership and the exact pair', () => {
  expect(isSamePair(base, { ...base, position: 'guard' })).toBe(true);
  expect(isSamePair(base, { ...base, sessionId: 'new-reader' })).toBe(false);
  expect(isSamePair(base, { ...base, pairId: 'another-pair' })).toBe(false);
  expect(isSamePair(base, null)).toBe(false);
  expect(isSamePair(null, base)).toBe(false);
  expect(isSamePosition(base, base)).toBe(true);
  expect(isSamePosition(base, { ...base, position: 'guard' })).toBe(false);
  expect(isSamePosition(null, null)).toBe(true);
  expect(isSamePosition(base, null)).toBe(false);
});
