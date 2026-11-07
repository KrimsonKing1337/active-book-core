import { act, renderHook } from '@testing-library/react';

import { createVisualEffects } from '../createVisualEffects';
import { registration } from '../testFixtures';

import { useVisualRegistrations } from './useVisualRegistrations';

const definition = {
  id: 'static', defaultParams: {}, Renderer: () => null,
};

test('equal descriptions skip updates; props and componentKey update the same registration', () => {
  const session = createVisualEffects({ pages: 5, definitions: [definition] });
  const update = jest.spyOn(session, 'update');
  const register = jest.spyOn(session, 'register');
  const { rerender, unmount } = renderHook(({ params }) => useVisualRegistrations({
    session,
    registrations: [{ ...registration, effect: { ...registration.effect, params } }],
  }), { initialProps: { params: { componentKey: 'first', color: 'red' } } });
  const generation = session.getGeneration('test');
  rerender({ params: { componentKey: 'first', color: 'red' } });
  expect(update).not.toHaveBeenCalled();
  rerender({ params: { componentKey: 'first', color: 'blue' } });
  expect(update).toHaveBeenCalledTimes(1);
  rerender({ params: { componentKey: 'second', color: 'blue' } });
  expect(update).toHaveBeenCalledTimes(2);
  expect(register).toHaveBeenCalledTimes(1);
  expect(session.getGeneration('test')).toBe(generation);
  expect(session.getSnapshot()[0].effect.params.componentKey).toBe('second');
  unmount();
  expect(session.getSnapshot()).toEqual([]);
});

test('pending definitions can load, unload and reload without leaving stale registrations', () => {
  const session = createVisualEffects({ pages: 5 });
  const { rerender, unmount } = renderHook(({ definitions }) => useVisualRegistrations({
    session,
    registrations: [registration],
    definitions,
  }), { initialProps: { definitions: [] as typeof definition[] } });
  expect(session.getSnapshot()).toEqual([]);
  rerender({ definitions: [definition] });
  expect(session.getSnapshot()).toHaveLength(1);
  rerender({ definitions: [] });
  expect(session.getSnapshot()).toEqual([]);
  rerender({ definitions: [definition] });
  expect(session.getSnapshot()).toHaveLength(1);
  unmount();
  act(() => session.destroy());
  expect(() => session.register(registration)).toThrow('destroyed');
});
