import {
  type PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { setWasmUrl } from '@lottiefiles/dotlottie-react';
import { nanoid } from 'nanoid';

import type { AudioEffect } from '@active-book/types';

import { useDispatch } from '@store';
import { mainActions } from '@store/main';

import { createVisualEffects, VisualEffectsContext } from '@controllers/visualEffects';
import { BookAudio } from '@controllers/bookAudio/BookAudio';
import { BookAudioContext } from '@controllers/bookAudio/context';

import { BookPresentationContext } from '@hooks/pagePresentation/context';

import { StoryRegionsProvider } from '@components/StoryRegionsProvider';
import { StoryWindowSessionContext } from '@components/StoryWindowHost/context';
import { useAppMode } from '@components/App/AppModeContext';
import { useStoryWindowSession } from '@components/StoryWindowHost/hooks';

import type { AppWrapperProps } from '../../@types';

import { AppContent } from '../AppContent';

export type BookSessionProps = PropsWithChildren<AppWrapperProps>;

const noAudio: readonly AudioEffect<number>[] = [];

export const BookSession = (props: BookSessionProps) => {
  const dispatch = useDispatch();

  const windowSessionId = useStoryWindowSession();

  const [sessionId] = useState(nanoid);
  const [audio] = useState(() => new BookAudio(sessionId));

  const isReader = useAppMode() === 'reader';
  const audioDescriptions = props.audioDescriptions ?? noAudio;

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

    audio.start();

    return () => {
      audio.close();

      dispatch(mainActions.closeBookSession(sessionId));
    };
  }, [
    dispatch,
    sessionId,
    initialNavigation,
    audio,
  ]);

  useLayoutEffect(() => {
    audio.configure(audioDescriptions, isReader);
  }, [
    audioDescriptions,
    isReader,
    audio,
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
            <BookAudioContext value={audio}>
              <AppContent {...props} visualEffects={session} />
            </BookAudioContext>
          </BookPresentationContext>
        </StoryRegionsProvider>
      </StoryWindowSessionContext>
    </VisualEffectsContext>
  );
};
