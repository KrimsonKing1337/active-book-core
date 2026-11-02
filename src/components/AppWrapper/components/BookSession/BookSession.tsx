import type { PropsWithChildren } from 'react';

import { useEffect, useRef, useState } from 'react';

import { createVisualEffects, VisualEffectsContext } from '@controllers/visualEffects';

import type { AppWrapperProps } from '../../@types';

import { AppContent } from '../AppContent';

export type { AppWrapperProps } from '../../@types';

export const BookSession = (props: PropsWithChildren<AppWrapperProps>) => {
  const [ownedSession] = useState(() => {
    if (props.visualEffects) {
      return null;
    }

    return createVisualEffects({ pages: props.config.pages, definitions: props.definitions });
  });

  const session = props.visualEffects ?? ownedSession;
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      queueMicrotask(() => {
        if (!mountedRef.current) {
          ownedSession?.destroy();
        }
      });
    };
  }, [ownedSession]);

  if (!session) {
    throw new Error('Changing visual session ownership requires a new bookKey');
  }

  return (
    <VisualEffectsContext value={session}>
      <AppContent {...props} visualEffects={session} />
    </VisualEffectsContext>
  );
};
