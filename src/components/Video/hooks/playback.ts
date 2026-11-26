import type { RefObject } from 'react';

import {
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import {
  BookPresentationContext,
  useCanStartPageEffects,
  usePagePresented,
} from '@hooks/pagePresentation/context';

import { CarouselSlideActiveContext, useCarouselSlideActive } from '@components/Carousel/context';

import type { VideoPlayback } from '../utils';

import { VideoPlaybackContext } from '../context';
import {
  createVideoPlayback,
  disposeVideo,
  listenVideoPlayback,
  updateVideoPlayback,
} from '../utils';

type PlaybackOptions = {
  id: string;
  src: string;
  autoPlay: boolean;
  preserveTime: boolean;
};

export const useVideoPlayback = (ref: RefObject<HTMLVideoElement | null>, options: PlaybackOptions) => {
  const {
    id,
    src,
    autoPlay,
    preserveTime,
  } = options;
  const dialog = useContext(VideoPlaybackContext);
  const isInCarousel = useContext(CarouselSlideActiveContext) !== undefined;
  const bookSession = useContext(BookPresentationContext);
  const isSlideActive = useCarouselSlideActive();
  const canStart = useCanStartPageEffects();
  const presented = usePagePresented();
  const managed = isInCarousel || dialog !== null;
  const playbackRef = useRef<VideoPlayback | null>(null);
  const sourceRef = useRef({ id, src });

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const previous = playbackRef.current;
    const sourceChanged = sourceRef.current.id !== id || sourceRef.current.src !== src;

    if (!previous || previous.element !== element || sourceChanged) {
      if (previous) {
        previous.disposed = true;
        previous.element.pause();
      }

      playbackRef.current = createVideoPlayback(element);
      sourceRef.current = { id, src };
    }

    const playback = playbackRef.current;

    if (!playback) {
      return;
    }

    playback.connected = true;
    const removeListeners = listenVideoPlayback(playback);

    return () => {
      playback.connected = false;
      removeListeners();

      queueMicrotask(() => {
        if (!playback.connected && playbackRef.current === playback) {
          disposeVideo(playback);
        }
      });
    };
  }, [
    ref,
    id,
    src,
  ]);

  useLayoutEffect(() => {
    const playback = playbackRef.current;

    if (playback) {
      updateVideoPlayback(playback, {
        active: isSlideActive && (playback.initialized || (presented && canStart())),
        managed,
        autoPlay: autoPlay && (managed || bookSession !== null),
        resetOnDispose: dialog !== null || !preserveTime,
        isCurrentWindow: dialog?.isCurrentWindow,
      });
    }
  }, [
    ref,
    id,
    src,
    isSlideActive,
    bookSession,
    presented,
    canStart,
    managed,
    autoPlay,
    preserveTime,
    dialog,
  ]);

  return managed;
};
