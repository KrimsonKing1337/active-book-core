import { getDialogDimension } from '../utils';

test('defaults to 75 percent and preserves fractional authored percentages', () => {
  expect(getDialogDimension()).toBe('75%');
  expect(getDialogDimension(60.5)).toBe('60.5%');
  expect(getDialogDimension(100)).toBe('100%');
});

test.each([
  0,
  -1,
  101,
  NaN,
  Infinity,
])('rejects an invalid authored dimension: %s', (dimension) => {
  expect(() => getDialogDimension(dimension)).toThrow(RangeError);
});
