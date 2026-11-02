import { useCallback, useLayoutEffect, useRef } from 'react';

import { useStore } from '@store';
import { effectsActions } from '@store/effects/common';

type MediaKind = 'images' | 'videos';
type MediaLoad = {
  src: string;
  ready: boolean;
};

/** Redux retains loading counters, never visual instances or their lifetime. */
export const useMediaReadiness = <Element extends HTMLImageElement | HTMLVideoElement>(
  kind: MediaKind,
  src?: string,
) => {
  const store = useStore();
  const activeRef = useRef<MediaLoad | null>(null);
  const elementRef = useRef<Element | null>(null);

  const changeCount = useCallback((amount: number, ready: boolean) => {
    const state = store.getState().effects;

    if (kind === 'images') {
      if (ready) {
        store.dispatch(effectsActions.setImagesReadyAmount(state.imagesReadyAmount + amount));
      } else {
        store.dispatch(effectsActions.setImagesAmount(state.imagesAmount + amount));
      }
    } else if (ready) {
      store.dispatch(effectsActions.setVideosReadyAmount(state.videosReadyAmount + amount));
    } else {
      store.dispatch(effectsActions.setVideosAmount(state.videosAmount + amount));
    }
  }, [kind, store]);

  useLayoutEffect(() => {
    if (!src?.trim()) {
      return;
    }

    const element = elementRef.current;
    const sameSource = element?.currentSrc === element?.src;
    const ready = sameSource && (element instanceof HTMLImageElement
      ? element.complete
      : element instanceof HTMLVideoElement && element.readyState >= 2);
    const load = {
      src,
      ready,
    };
    activeRef.current = load;
    changeCount(1, false);
    if (ready) {
      changeCount(1, true);
    }

    return () => {
      activeRef.current = null;
      changeCount(-1, false);
      if (load.ready) {
        changeCount(-1, true);
      }
    };
  }, [src, changeCount]);

  const markReady = useCallback(() => {
    const load = activeRef.current;
    if (!load || load.src !== src || load.ready) {
      return;
    }

    load.ready = true;
    changeCount(1, true);
  }, [src, changeCount]);

  return {
    elementRef,
    markReady,
  };
};
