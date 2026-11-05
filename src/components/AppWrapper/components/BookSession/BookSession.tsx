import { type PropsWithChildren, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useDispatch } from '@store';
import { mainActions } from '@store/main';

import { createVisualEffects, VisualEffectsContext } from '@controllers/visualEffects';

import { NarrativeFrameContext } from '@components/PageWrapper/NarrativeFrameContext';


import type { AppWrapperProps } from '../../@types';

import { AppContent } from '../AppContent';

export type { AppWrapperProps } from '../../@types';

export type BookSessionProps = PropsWithChildren<AppWrapperProps>;

export const BookSession = (props: BookSessionProps) => {
  const dispatch = useDispatch();
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const frameTarget = useMemo(() => ({
    element: frame,
    attach: setFrame,
  }), [frame]);
  const initialPageIdRef = useRef(props.initialPageId ?? null);

  useLayoutEffect(() => {
    dispatch(mainActions.setPage(initialPageIdRef.current));
  }, [dispatch]);

  const [ownedSession] = useState(() => {
    if (props.visualEffects) {
      return null;
    }

    return createVisualEffects({
      pages: props.storyPages.length,
      definitions: props.definitions,
    });
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
      <NarrativeFrameContext value={frameTarget}>
        <AppContent {...props} visualEffects={session} />
      </NarrativeFrameContext>
    </VisualEffectsContext>
  );
};
