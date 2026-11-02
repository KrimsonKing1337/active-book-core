import { createVisualEffects } from './createVisualEffects';
import { registration } from './testFixtures';

const options = {
  pages: 5,
  definitions: [{ id: 'static', defaultParams: { color: 'blue' }, Renderer: () => null }],
};

test('stores copied serializable registrations, diagnoses IDs and unknown definitions', () => {
  const visualEffects = createVisualEffects(options);
  const onChange = jest.fn();
  const unsubscribe = visualEffects.subscribe(onChange);
  visualEffects.register(registration);

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(visualEffects.getSnapshot()[0]).toEqual(registration);
  expect(visualEffects.getSnapshot()[0]).not.toBe(registration);
  expect(Object.isFrozen(visualEffects.getSnapshot()[0].effect.params)).toBe(true);
  expect(JSON.parse(JSON.stringify(visualEffects.getSnapshot()))).toEqual([registration]);
  expect(() => visualEffects.register(registration)).toThrow('Duplicate');
  expect(() => visualEffects.register({
    ...registration,
    effect: { ...registration.effect, id: 'other', definitionId: 'missing' },
  })).toThrow('Unknown visual definition ID: missing');
  unsubscribe();
  visualEffects.remove('test');
  expect(onChange).toHaveBeenCalledTimes(1);
});

test('addressed updates preserve other registrations and unchanged parameter references', () => {
  const visualEffects = createVisualEffects(options);
  visualEffects.register(registration);
  visualEffects.register({ ...registration, effect: { ...registration.effect, id: 'other' } });
  const before = visualEffects.getSnapshot();
  visualEffects.update('test', { effect: { depth: { plane: 'scene', order: 2 } } });
  const after = visualEffects.getSnapshot();

  expect(after[0].effect.params).toBe(before[0].effect.params);
  expect(after[1]).toBe(before[1]);
  expect(after[0].effect.depth.order).toBe(2);
  expect(before[0].effect.depth.order).toBe(0);
  visualEffects.update('test', { effect: { params: { label: 'updated' } } });
  expect(visualEffects.getSnapshot()[0].effect.params).toEqual({ label: 'updated' });
  visualEffects.remove('test');
  visualEffects.remove('test');
  expect(visualEffects.getSnapshot()).toEqual([after[1]]);
  expect(() => visualEffects.update('missing', {})).toThrow('Unknown visual effect ID');
});

test('stale registration disposers cannot delete a replacement with the same ID', () => {
  const visualEffects = createVisualEffects(options);
  const unregister = visualEffects.register(registration);
  const before = visualEffects.getGeneration('test');
  visualEffects.remove('test');
  visualEffects.register(registration);
  unregister();

  expect(visualEffects.getSnapshot()).toHaveLength(1);
  expect(visualEffects.getGeneration('test')).not.toBe(before);
});

test('rejects invalid ranges, duplicate definitions and nonserializable data without changing the snapshot', () => {
  const visualEffects = createVisualEffects(options);
  visualEffects.register(registration);
  const before = visualEffects.getSnapshot();

  expect(() => createVisualEffects({ ...options, definitions: [...options.definitions, ...options.definitions] }))
    .toThrow('Duplicate');
  expect(() => createVisualEffects({ ...options, pages: 0 })).toThrow('page count');
  expect(() => visualEffects.update('test', { lifetime: { type: 'range', range: [{ from: 3, to: 2 }] } }))
    .toThrow('reversed');
  expect(() => visualEffects.update('test', { lifetime: { type: 'page', page: 6 } })).toThrow('between 1 and 5');
  expect(() => visualEffects.update('test', { lifetime: { type: 'page', page: 1.5 } })).toThrow('integer');
  expect(() => visualEffects.update('test', { effect: { params: { value: Infinity } } })).toThrow('JSON');
  expect(() => visualEffects.update('test', {
    // @ts-expect-error Runtime callers must not put functions in serialized parameters.
    effect: { params: { callback: () => {} } },
  })).toThrow('JSON');
  expect(visualEffects.getSnapshot()).toBe(before);
});

test('the same IDs are independent in different books and a session has one host', () => {
  const first = createVisualEffects(options);
  const second = createVisualEffects(options);
  first.register(registration);
  second.register(registration);
  first.remove('test');
  expect(second.getSnapshot()).toHaveLength(1);
  const disconnect = first.connectHost();
  expect(() => first.connectHost()).toThrow('one book root');
  disconnect();
  first.connectHost()();
});
