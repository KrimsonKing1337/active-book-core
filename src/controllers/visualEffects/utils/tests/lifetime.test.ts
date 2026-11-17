import { isVisualEffectActive, validateVisualLifetime } from '../lifetime';

test('page lifetime only includes its page', () => {
  expect(isVisualEffectActive({ type: 'page', page: 2 }, 2)).toBe(true);
  expect(isVisualEffectActive({ type: 'page', page: 2 }, 1)).toBe(false);
});

test('range membership is inclusive and positional, including disjoint ranges and no ranges', () => {
  const lifetime = {
    type: 'range' as const,
    range: [{ from: 2, to: 3 }, { from: 5, to: 5 }],
  };
  const original = JSON.stringify(lifetime);

  expect([
    0,
    1,
    2,
    3,
    4,
    5,
    6,
  ].map((cur) => isVisualEffectActive(lifetime, cur)))
    .toEqual([
      false,
      false,
      true,
      true,
      false,
      true,
      false,
    ]);
  validateVisualLifetime(lifetime, 6);
  expect(JSON.stringify(lifetime)).toBe(original);
  expect(isVisualEffectActive({ type: 'range', range: [] }, 1)).toBe(false);
});
