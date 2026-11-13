import {
  type RefObject,
  useLayoutEffect,
  useRef,
} from 'react';

import { useDispatch, useStore } from '@store';
import { effectsActions } from '@store/effects/common';

type VideoTimeOptions = {
  id: string;
  src: string;
  preserveTime: boolean;
};

type VideoTime = {
  id: string;
  src: string;
  time: number;
  restore: number;
};

type VideoRef = RefObject<HTMLVideoElement | null>;

export const useVideoTime = (ref: VideoRef, options: VideoTimeOptions) => {
  const {
    id,
    src,
    preserveTime,
  } = options;

  const store = useStore();
  const dispatch = useDispatch();

  const trackingRef = useRef<VideoTime | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const previous = trackingRef.current;

    if (!previous || previous.id !== id || previous.src !== src) {
      let savedTime = 0;

      if (!previous && preserveTime) {
        savedTime = store.getState().effects.videosCurrentTime[id] ?? 0;
      }

      if (previous) {
        element.currentTime = 0;

        if (preserveTime) {
          dispatch(effectsActions.setVideoCurrentTime({ id, currentTime: 0 }));
        }
      }

      trackingRef.current = {
        id,
        src,
        time: element.currentTime,
        restore: savedTime,
      };
    }

    const tracking = trackingRef.current;

    if (!tracking) {
      return;
    }

    if (!preserveTime) {
      return;
    }

    tracking.time = element.currentTime;

    const restoreTime = () => {
      if (trackingRef.current !== tracking || !tracking.restore) {
        return;
      }

      element.currentTime = tracking.restore;

      tracking.time = element.currentTime;
      tracking.restore = 0;
    };

    const handleTimeUpdate = () => {
      tracking.time = element.currentTime;
    };

    if (element.readyState >= 1) {
      restoreTime();
    } else {
      element.addEventListener('loadedmetadata', restoreTime, { once: true });
    }

    element.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      element.removeEventListener('loadedmetadata', restoreTime);
      element.removeEventListener('timeupdate', handleTimeUpdate);

      if (preserveTime && tracking.time) {
        dispatch(effectsActions.setVideoCurrentTime({ id, currentTime: tracking.time }));
      }
    };
  }, [
    id,
    src,
    preserveTime,
    ref,
    store,
    dispatch,
  ]);
};
