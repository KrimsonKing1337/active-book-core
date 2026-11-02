import {
  isValidElement, useCallback, useEffect, useRef,
} from 'react';

import { isEqual } from 'lodash-es';

import type { VisualEffectRegistration } from '@active-book/types';

import type { VisualEffects } from '../createVisualEffects';
import type { VisualEffectChanges } from '../@types';
import type { BuiltinDeclaration } from '../utils/declarations';

import { createBuiltinRegistration } from '../utils/declarations';

type ActiveDeclaration = {
  registration: VisualEffectRegistration;
  component: BuiltinDeclaration['options']['Component'];
  remove: () => void;
};

/** Reconcile declarations; updates never unregister an unchanged definition. */
export const useBuiltinDeclarations = (session: VisualEffects | null, declarations: readonly BuiltinDeclaration[]) => {
  const activeRef = useRef(new Map<string, ActiveDeclaration>());

  const clear = useCallback(() => {
    activeRef.current.forEach((cur) => cur.remove());
    activeRef.current.clear();
  }, []);

  useEffect(() => {
    if (!session) {
      if (declarations.length > 0) {
        throw new Error('Visual effect declarations require a book visual effects session');
      }

      return;
    }
    const active = activeRef.current;
    const ids = new Set(declarations.map((cur) => cur.options.id));
    for (const [id, previous] of active) {
      if (!ids.has(id)) {
        previous.remove();
        active.delete(id);
      }
    }

    for (const declarationCur of declarations) {
      const registration = createBuiltinRegistration(declarationCur);
      const { id, definitionId } = registration.effect;
      const component = declarationCur.options.Component;
      let previous = active.get(id);

      if (previous && previous.registration.effect.definitionId !== definitionId) {
        previous.remove();
        active.delete(id);
        previous = undefined;
      }

      const sameComponent = isValidElement(previous?.component) && isValidElement(component)
        ? previous.component.type === component.type && isEqual(previous.component.props, component.props)
        : previous?.component === component;

      if (previous && isEqual(previous.registration, registration) && sameComponent) {
        continue;
      }

      session.setRuntimeComponent(id, component);
      if (previous) {
        const changes: VisualEffectChanges = { effect: registration.effect };
        if (!isEqual(previous.registration.lifetime, registration.lifetime)) {
          changes.lifetime = registration.lifetime;
        }
        session.update(id, changes);
        previous.registration = registration;
        previous.component = component;
      } else {
        const remove = session.register(registration);
        active.set(id, {
          registration,
          component,
          remove,
        });
      }
    }
  }, [session, declarations]);

  useEffect(() => clear, [session, clear]);

  return clear;
};
