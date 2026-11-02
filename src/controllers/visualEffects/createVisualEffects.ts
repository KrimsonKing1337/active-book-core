import type { ReactNode } from 'react';

import type { VisualEffectRegistration } from '@active-book/types';

import type { CreateVisualEffectsOptions, HostVisualEffectDefinition, VisualEffectChanges } from './@types';

import { builtinVisualDefinitions } from './definitions';

import { createVisualControllers } from './utils/controllers';
import { copyVisualData } from './utils/serialization';
import { validateVisualLifetime } from './utils/lifetime';

export const createVisualEffects = ({ definitions = [], pages }: CreateVisualEffectsOptions) => {
  if (!Number.isInteger(pages) || pages < 1) {
    throw new Error('Visual effects require a positive integer book page count');
  }

  const implementations = new Map<string, HostVisualEffectDefinition>();
  const registrations = new Map<string, VisualEffectRegistration>();
  const runtimeComponents = new Map<string, ReactNode>();
  const generations = new Map<string, number>();
  const listeners = new Set<() => void>();

  let snapshot: readonly VisualEffectRegistration[] = Object.freeze([]);
  let nextGeneration = 0;
  let hasHost = false;

  for (const definitionCur of [...builtinVisualDefinitions, ...definitions]) {
    if (!definitionCur.id || implementations.has(definitionCur.id)) {
      throw new Error(`Duplicate or empty visual definition ID: ${definitionCur.id}`);
    }

    implementations.set(definitionCur.id, Object.freeze({
      ...definitionCur,
      defaultParams: copyVisualData(definitionCur.defaultParams),
    }));
  }

  const publish = () => {
    snapshot = Object.freeze([...registrations.values()]);

    listeners.forEach((cur) => cur());
  };

  const getDefinition = (id: string) => {
    const definition = implementations.get(id);

    if (!definition) {
      throw new Error(`Unknown visual definition ID: ${id}`);
    }

    return definition;
  };

  const remove = (id: string) => {
    if (registrations.delete(id)) {
      controllers.invalidate(id);
      generations.delete(id);
      runtimeComponents.delete(id);

      publish();
    }
  };

  const controllers = createVisualControllers({ remove });

  const register = (registration: VisualEffectRegistration) => {
    const { id, definitionId } = registration.effect;

    if (!id || registrations.has(id)) {
      throw new Error(`Duplicate or empty visual effect ID: ${id}`);
    }

    getDefinition(definitionId);
    validateVisualLifetime(registration.lifetime, pages);

    const copied = copyVisualData(registration);
    const generation = ++nextGeneration;

    registrations.set(id, copied);
    generations.set(id, generation);

    publish();

    // An old declaration's delayed cleanup must not delete a replacement with the same ID.
    return () => {
      if (generations.get(id) === generation) {
        remove(id);
      }
    };
  };

  const update = (id: string, changes: VisualEffectChanges) => {
    const previous = registrations.get(id);

    if (!previous) {
      throw new Error(`Unknown visual effect ID: ${id}`);
    }

    const copiedChanges = copyVisualData(changes);

    const effect = Object.freeze({
      ...previous.effect,
      ...copiedChanges.effect,
      id,
      definitionId: previous.effect.definitionId,
    });

    const lifetime = copiedChanges.lifetime ?? previous.lifetime;

    if (copiedChanges.lifetime) {
      validateVisualLifetime(lifetime, pages);
    }

    registrations.set(id, Object.freeze({
      effect,
      lifetime,
    }));

    publish();
  };

  const getSnapshot = () => snapshot;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const getGeneration = (id: string) => generations.get(id);

  const setPageCount = (count: number) => {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error('Visual effects require a positive integer book page count');
    }

    if (pages === count) {
      return;
    }
    // Existing authored ranges keep their positions, including endpoints beyond a shortened book.
    pages = count;
    listeners.forEach((cur) => cur());
  };

  const getPageCount = () => pages;

  // Temporary declaration bridge: React nodes never enter parameters or serialized snapshots.
  const setRuntimeComponent = (id: string, component: ReactNode) => {
    runtimeComponents.set(id, component);
  };
  const getRuntimeComponent = (id: string) => runtimeComponents.get(id);

  const connectHost = () => {
    if (hasHost) {
      throw new Error('A visual effects session can only belong to one book root');
    }

    hasHost = true;

    return () => {
      hasHost = false;

      controllers.clear();
    };
  };

  return {
    register,
    update,
    remove,
    getSnapshot,
    subscribe,
    getDefinition,
    getGeneration,
    setPageCount,
    getPageCount,
    setRuntimeComponent,
    getRuntimeComponent,
    connectHost,
    attachController: controllers.attach,
    getController: controllers.get,
  };
};

export type VisualEffects = ReturnType<typeof createVisualEffects>;
