import type { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';

import type { FrameEffect } from '@hooks/effects/frame/@types';
import { useFrameEffect, useFrameEffects } from '@hooks/effects/frame';
import { useVibration } from '@hooks/effects/vibration';
import { useFlashlight } from '@hooks/effects/flashlight';

import { createVisualEffects } from '../createVisualEffects';
import { VisualEffectsContext } from '../context';
import { createBuiltinRegistration } from './declarations';
import { useVisualRegistrations } from '../hooks/useVisualRegistrations';

const frame: FrameEffect = {
  id: 'frame',
  kind: 'shadow',
  shadow: {
    id: 'shadow',
    sides: ['left'],
    thickness: 35,
    style: {
      color: 'red',
      opacity: 0.6,
    },
    animation: {
      preset: 'pulse',
      duration: 3000,
    },
  },
};

beforeEach(() => {
  store.dispatch(mainActions.setStoryPages(['one', 'two', 'three', 'four', 'five']));
  store.dispatch(mainActions.setPage(1));
});

test('physical vibration and flashlight work without a host when no visual feedback is declared', () => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <StoreProvider>
      {children}
    </StoreProvider>
  );
  const { result, unmount } = renderHook(() => ({
    vibration: useVibration(),
    flashlight: useFlashlight(),
  }), { wrapper });

  expect(typeof result.current.vibration.vibrationOn).toBe('function');
  expect(typeof result.current.flashlight.flashlightOn).toBe('function');
  unmount();
});

test('page declarations update the existing registration and release it on unmount', () => {
  const session = createVisualEffects({ pages: 5 });
  const wrapper = ({ children }: PropsWithChildren) => (
    <StoreProvider>
      <VisualEffectsContext value={session}>
        {children}
      </VisualEffectsContext>
    </StoreProvider>
  );
  const { rerender, unmount } = renderHook(({ effect }) => useFrameEffect(effect), {
    wrapper,
    initialProps: { effect: frame },
  });
  const generation = session.getGeneration('frame');
  expect(session.getSnapshot()[0].lifetime).toEqual({
    type: 'page',
    page: 1,
  });
  rerender({
    effect: {
      ...frame,
      layer: 'above',
    },
  });
  expect(session.getGeneration('frame')).toBe(generation);
  expect(session.getSnapshot()[0].effect.depth.plane).toBe('aboveNarrative');
  unmount();
  expect(session.getSnapshot()).toEqual([]);
});

test('implicit page declarations wait for synchronized book bounds and react to count updates', () => {
  const session = createVisualEffects({ pages: 1 });
  store.dispatch(mainActions.setPage(2));
  const wrapper = ({ children }: PropsWithChildren) => (
    <StoreProvider>
      <VisualEffectsContext value={session}>
        {children}
      </VisualEffectsContext>
    </StoreProvider>
  );
  const { unmount } = renderHook(() => useFrameEffect(frame), { wrapper });
  expect(session.getSnapshot()).toEqual([]);
  act(() => session.setPageCount(2));
  expect(session.getSnapshot()[0].lifetime).toEqual({
    type: 'page',
    page: 2,
  });
  act(() => session.setPageCount(1));
  expect(session.getSnapshot()).toEqual([]);
  unmount();
});

test('frame controls merge style and animation changes through the common session', () => {
  const session = createVisualEffects({ pages: 5 });
  session.register(createBuiltinRegistration({
    type: 'frame',
    options: frame,
    lifetime: {
      type: 'page',
      page: 1,
    },
  }));
  const wrapper = ({ children }: PropsWithChildren) => (
    <VisualEffectsContext value={session}>
      {children}
    </VisualEffectsContext>
  );
  const { result } = renderHook(useFrameEffects, { wrapper });
  const generation = session.getGeneration('frame');
  act(() => result.current.updateShadow('frame', 'shadow', {
    hidden: true,
    style: { color: 'blue' },
  }));
  act(() => result.current.updateShadow('frame', 'shadow', { animation: { playState: 'paused' } }));
  expect(result.current.effects.frame.shadow).toMatchObject({
    hidden: true,
    style: {
      color: 'blue',
      opacity: 0.6,
    },
    animation: {
      preset: 'pulse',
      duration: 3000,
      playState: 'paused',
    },
  });
  act(() => result.current.updateShadow('frame', 'different-item', { hidden: false }));
  expect(result.current.effects.frame.shadow?.hidden).toBe(true);
  act(() => result.current.updateShadow('frame', 'shadow', { style: { zIndex: 12 } }));
  expect(session.getSnapshot()[0].effect.depth.order).toBe(12);
  act(() => result.current.updateShadow('frame', 'shadow', { style: undefined }));
  expect(result.current.effects.frame.shadow?.style).toBeUndefined();
  expect(session.getSnapshot()[0].effect.depth.order).toBe(0);
  expect(session.getGeneration('frame')).toBe(generation);
});

test('range declarations reconcile equal input without replacing registration or serializing React nodes', () => {
  const session = createVisualEffects({ pages: 5 });
  const ranges = [{
    id: 'range',
    type: 'frame' as const,
    range: [{
      from: 1,
      to: 2,
    }, {
      from: 4,
      to: 4,
    }],
    options: {
      kind: 'component' as const,
    },
  }];
  const { rerender, unmount } = renderHook(() => {
    const registrations = ranges.map((rangeCur) => createBuiltinRegistration({
      type: rangeCur.type,
      options: {
        ...rangeCur.options,
        id: rangeCur.id,
      },
      lifetime: {
        type: 'range',
        range: rangeCur.range,
      },
    }));

    return useVisualRegistrations({
      session,
      registrations,
    });
  });
  const snapshot = session.getSnapshot();
  rerender();
  expect(session.getSnapshot()).toBe(snapshot);
  expect(JSON.stringify(snapshot)).not.toContain('RUNTIME COMPONENT');
  expect(snapshot[0].effect.params).not.toHaveProperty('id');
  unmount();
  expect(session.getSnapshot()).toEqual([]);
});

test('page count changes preserve registrations and authored endpoints while validating new lifetimes', () => {
  const session = createVisualEffects({ pages: 5 });
  const lifetime = {
    type: 'range' as const,
    range: [{
      from: 1,
      to: 5,
    }],
  };
  session.register(createBuiltinRegistration({
    type: 'frame',
    options: frame,
    lifetime,
  }));
  const generation = session.getGeneration('frame');
  session.setPageCount(2);
  session.update('frame', { effect: { params: { kind: 'shadow' } } });
  expect(session.getSnapshot()[0].lifetime).toEqual(lifetime);
  expect(session.getGeneration('frame')).toBe(generation);
  expect(() => session.setPageCount(0)).toThrow('positive integer');
  expect(() => session.register(createBuiltinRegistration({
    type: 'frame',
    options: {
      ...frame,
      id: 'outside',
    },
    lifetime: {
      type: 'page',
      page: 3,
    },
  }))).toThrow('between 1 and 2');
});

test.each(['background', 'frame'] as const)('%s fills the whole story viewport by default', (type) => {
  const registration = createBuiltinRegistration({
    type,
    options: {
      id: 'default-region',
      kind: 'component',
    },
    lifetime: {
      type: 'page',
      page: 1,
    },
  });

  expect(registration.effect.placement.region).toBe('storyViewport');
  expect(registration.effect.visibility).toEqual({});
  expect(registration.effect.depth.plane).toBe(type === 'background' ? 'background' : 'belowNarrative');
});

test('a masked frame uses its real narrative frame host and native side masks', () => {
  const registration = createBuiltinRegistration({
    type: 'frame',
    options: {
      id: 'masked',
      kind: 'component',
      frameMask: {
        enabled: true,
        sides: ['left', 'bottom'],
      },
    },
    lifetime: {
      type: 'page',
      page: 1,
    },
  });

  expect(registration.effect.placement.region).toBe('frame');
  expect(registration.effect.visibility).toEqual({
    sides: ['left', 'bottom'],
  });
});
