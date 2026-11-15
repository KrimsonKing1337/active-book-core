import type { JsonValue } from '@active-book/types';

import { copyVisualData } from '../serialization';

test('copies and freezes nested JSON without retaining mutable caller data', () => {
  const source = { nested: { values: [1, 2] } };
  const copied = copyVisualData(source);
  source.nested.values.push(3);

  expect(copied).toEqual({ nested: { values: [1, 2] } });
  expect(Object.isFrozen(copied.nested.values)).toBe(true);
});

test('rejects cyclic data and runtime resource objects', () => {
  const cyclic: Record<string, JsonValue> = {};
  cyclic.self = cyclic;
  expect(() => copyVisualData(cyclic)).toThrow('non-cyclic JSON');
  // @ts-expect-error Runtime resources do not satisfy the JSON contract.
  expect(() => copyVisualData({ resource: new Map() })).toThrow('plain JSON objects');
});

test('shared acyclic values remain valid JSON', () => {
  const shared = { value: true };
  expect(copyVisualData({ first: shared, second: shared })).toEqual({ first: shared, second: shared });
});
