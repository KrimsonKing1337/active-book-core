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

import { VideoPlaybackContext } from '../context';

import {
  type VideoPlayback,
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

  const playbackRef = useRef<VideoPlayback | null>(null);
  const sourceRef = useRef({ id, src });

  const managed = isInCarousel || dialog !== null;

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const previous = playbackRef.current;
    const sourceChanged = sourceRef.current.id !== id || sourceRef.current.src !== src;

    const elementsAreDifferent = previous?.element !== element;

    if (elementsAreDifferent || sourceChanged) {
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
        const isPlayback = playbackRef.current === playback;

        if (!playback.connected && isPlayback) {
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
      const canStartPlayback = canStart();
      const isReadyToStart = presented && canStartPlayback;
      const canActivatePlayback = playback.initialized || isReadyToStart;
      const isPlaybackActive = isSlideActive && canActivatePlayback;
      const canAutoPlay = managed || bookSession !== null;
      const shouldAutoPlay = autoPlay && canAutoPlay;
      const shouldResetOnDispose = dialog !== null || !preserveTime;

      updateVideoPlayback(playback, {
        active: isPlaybackActive,
        managed,
        autoPlay: shouldAutoPlay,
        resetOnDispose: shouldResetOnDispose,
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
    managed,
    autoPlay,
    preserveTime,
    dialog,
    canStart,
  ]);

  return managed;
};
