import {
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';

import { isEqual } from 'lodash-es';

import type { VisualEffectDefinition, VisualEffectRegistration } from '@active-book/types';

import type { VisualEffects } from '../createVisualEffects';

type OwnedRegistration = {
  registration: VisualEffectRegistration;
  remove: () => void;
};

const empty: readonly VisualEffectRegistration[] = [];

/** Reconcile this owner's descriptions; other declarations in the same session are independent. */
export type VisualRegistrationsOptions = {
  session: VisualEffects | null;
  registrations?: readonly VisualEffectRegistration[];
  definitions?: readonly VisualEffectDefinition[];
};

export const useVisualRegistrations = ({
  session,
  registrations = empty,
  definitions,
}: VisualRegistrationsOptions) => {
  const ownedRef = useRef(new Map<string, OwnedRegistration>());

  useLayoutEffect(() => {
    if (!session) {
      return;
    }

    if (definitions) {
      session.setDefinitions(definitions);
    }

    const owned = ownedRef.current;

    const availableRegistrations = registrations.filter((registrationCur) => {
      return session.hasDefinition(registrationCur.effect.definitionId);
    });

    const ids = new Set(
      availableRegistrations.map((cur) => cur.effect.id),
    );

    for (const [id, previous] of owned) {
      if (!ids.has(id)) {
        previous.remove();

        owned.delete(id);
      }
    }

    for (const registrationCur of availableRegistrations) {
      const { id, definitionId } = registrationCur.effect;

      let previous = owned.get(id);

      if (previous && previous.registration.effect.definitionId !== definitionId) {
        previous.remove();

        owned.delete(id);

        previous = undefined;
      }

      if (previous && isEqual(previous.registration, registrationCur)) {
        continue;
      }

      if (previous && session.getGeneration(id) !== undefined) {
        session.update(id, registrationCur);

        previous.registration = registrationCur;
      } else {
        const remove = session.register(registrationCur);

        owned.set(id, {
          registration: registrationCur,
          remove,
        });
      }
    }
  }, [
    session,
    registrations,
    definitions,
  ]);

  const clear = useCallback(() => {
    ownedRef.current.forEach((cur) => cur.remove());
    ownedRef.current.clear();
  }, []);

  useLayoutEffect(() => {
    return clear;
  }, [session, clear]);

  return clear;
};
