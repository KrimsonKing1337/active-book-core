import type { PropsWithChildren } from 'react';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { useDispatch } from '@store';
import { mainActions } from '@store/main';

import { createVisualEffects, VisualEffectsContext } from '@controllers/visualEffects';

import { StoryRegionsProvider } from '@components/StoryRegionsProvider';
import { StoryWindowSessionContext } from '@components/StoryWindowHost/context';
import { useStoryWindowSession } from '@components/StoryWindowHost/hooks';

import type { AppWrapperProps } from '../../@types';

import { AppContent } from '../AppContent';

export type BookSessionProps = PropsWithChildren<AppWrapperProps>;

export const BookSession = (props: BookSessionProps) => {
  const dispatch = useDispatch();

  const windowSessionId = useStoryWindowSession();

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
      <StoryWindowSessionContext value={windowSessionId}>
        <StoryRegionsProvider>
          <AppContent {...props} visualEffects={session} />
        </StoryRegionsProvider>
      </StoryWindowSessionContext>
    </VisualEffectsContext>
  );
};
