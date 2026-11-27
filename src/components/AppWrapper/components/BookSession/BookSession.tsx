import type { PropsWithChildren } from 'react';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { setWasmUrl } from '@lottiefiles/dotlottie-react';
import { nanoid } from '@reduxjs/toolkit';

import { useDispatch } from '@store';
import { mainActions } from '@store/main';

import { createVisualEffects, VisualEffectsContext } from '@controllers/visualEffects';

import { BookPresentationContext } from '@hooks/pagePresentation/context';

import { StoryRegionsProvider } from '@components/StoryRegionsProvider';
import { StoryWindowSessionContext } from '@components/StoryWindowHost/context';
import { useStoryWindowSession } from '@components/StoryWindowHost/hooks';

import type { AppWrapperProps } from '../../@types';

import { AppContent } from '../AppContent';

export type BookSessionProps = PropsWithChildren<AppWrapperProps>;

export const BookSession = (props: BookSessionProps) => {
  const dispatch = useDispatch();

  const windowSessionId = useStoryWindowSession();

  const [sessionId] = useState(nanoid);

  const [initialNavigation] = useState(() => {
    const pageIds = props.storyPages.map((pageCur) => {
      return pageCur.id;
    });

    const initialPage = props.initialPageId ?? null;

    return {
      sessionId,
      pageIds,
      initialPage,
    };
  });

  useLayoutEffect(() => {
    setWasmUrl('/vendors/dotlottie-player.wasm');

    dispatch(mainActions.openBookSession(initialNavigation));

    return () => {
      dispatch(mainActions.closeBookSession(sessionId));
    };
  }, [
    dispatch,
    sessionId,
    initialNavigation,
  ]);

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
          <BookPresentationContext value={sessionId}>
            <AppContent {...props} visualEffects={session} />
          </BookPresentationContext>
        </StoryRegionsProvider>
      </StoryWindowSessionContext>
    </VisualEffectsContext>
  );
};
