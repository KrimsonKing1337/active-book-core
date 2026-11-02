import { isEqual } from 'lodash-es';

import type { VisualEffectDefinition, VisualEffectRegistration } from '@active-book/types';

import type { CreateVisualEffectsOptions, HostVisualEffectDefinition, VisualEffectChanges } from './@types';

import { builtinVisualDefinitions } from './definitions';
import { copyVisualData, createVisualControllers, validateVisualLifetime } from './utils';

export const createVisualEffects = ({ definitions = [], pages }: CreateVisualEffectsOptions) => {
  if (!Number.isInteger(pages) || pages < 1) {
    throw new Error('Visual effects require a positive integer book page count');
  }

  const implementations = new Map<string, HostVisualEffectDefinition>();
  const registrations = new Map<string, VisualEffectRegistration>();
  const generations = new Map<string, number>();
  const listeners = new Set<() => void>();

  let snapshot: readonly VisualEffectRegistration[] = Object.freeze([]);
  let nextGeneration = 0;
  let hasHost = false;
  let destroyed = false;

  const assertOpen = () => {
    if (destroyed) {
      throw new Error('Visual effects session has been destroyed');
    }
  };

  const allDefinitions = [...builtinVisualDefinitions, ...definitions];

  for (const definitionCur of allDefinitions) {
    const { id } = definitionCur;

    if (!id || implementations.has(id)) {
      throw new Error(`Duplicate or empty visual definition ID: ${id}`);
    }

    const defaultParams = copyVisualData(definitionCur.defaultParams);

    implementations.set(id, Object.freeze({
      ...definitionCur,
      defaultParams,
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

      publish();
    }
  };

  const controllers = createVisualControllers({ remove });

  const register = (registration: VisualEffectRegistration) => {
    assertOpen();

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
    assertOpen();

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

  const hasDefinition = (id: string) => implementations.has(id);

  const setDefinitions = (definitions: readonly VisualEffectDefinition[]) => {
    assertOpen();

    const next = new Map<string, HostVisualEffectDefinition>();
    const allDefinitions = [...builtinVisualDefinitions, ...definitions];

    for (const definitionCur of allDefinitions) {
      const { id, defaultParams, Renderer } = definitionCur;

      if (!id || next.has(id)) {
        throw new Error(`Duplicate or empty visual definition ID: ${id}`);
      }

      const previous = implementations.get(id);

      const renderersAreEqual = previous?.Renderer === Renderer;
      const paramsAreEqual = isEqual(previous?.defaultParams, defaultParams);

      const unchanged = renderersAreEqual && paramsAreEqual;

      let copied = previous;

      if (!unchanged || !copied) {
        const copiedDefaultParams = copyVisualData(defaultParams);

        copied = Object.freeze({
          ...definitionCur,
          defaultParams: copiedDefaultParams,
        });
      }

      next.set(id, copied);
    }

    const hasChangedSize = next.size !== implementations.size;

    const hasChangedDefinitions = [...next].some(([id, definition]) => {
      return implementations.get(id) !== definition;
    });

    const changed = hasChangedSize || hasChangedDefinitions;

    if (!changed) {
      return;
    }

    for (const registrationCur of registrations.values()) {
      if (!next.has(registrationCur.effect.definitionId)) {
        remove(registrationCur.effect.id);
      }
    }

    implementations.clear();

    next.forEach((definition, id) => {
      implementations.set(id, definition);
    });

    publish();
  };

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    registrations.clear();
    implementations.clear();
    generations.clear();
    controllers.clear();
    publish();
    listeners.clear();
  };

  const getSnapshot = () => snapshot;

  const subscribe = (listener: () => void) => {
    if (destroyed) {
      return () => {};
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const getGeneration = (id: string) => generations.get(id);

  const setPageCount = (count: number) => {
    assertOpen();

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

  const connectHost = () => {
    assertOpen();

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
    hasDefinition,
    setDefinitions,
    destroy,
    getGeneration,
    setPageCount,
    getPageCount,
    connectHost,
    attachController: controllers.attach,
    getController: controllers.get,
  };
};

export type VisualEffects = ReturnType<typeof createVisualEffects>;
