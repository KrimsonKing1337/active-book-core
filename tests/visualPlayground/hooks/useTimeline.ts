import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import { useVisualEffects } from '@controllers/visualEffects';

import { numberParam } from '../utils';

type TimelineCallbacks = {
  frame?: (progress: number) => void;
  finish?: () => void;
};

/** One animation clock. Commands create runs; mounting and StrictMode replay do not. */
export const useTimeline = (props: VisualRendererProps, callbacks: TimelineCallbacks = {}) => {
  const session = useVisualEffects();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [token] = useState(() => crypto.randomUUID());
  const frameRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const startedRef = useRef(0);
  const pausedRef = useRef(false);
  const reporterRef = useRef<ReturnType<typeof session.runs.start> | null>(null);
  const currentRef = useRef({ props, callbacks });

  useLayoutEffect(() => {
    currentRef.current = { props, callbacks };
  });

  const clearFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearFrame();
    reporterRef.current?.cancel();
    reporterRef.current = null;
    pausedRef.current = false;
    elapsedRef.current = 0;
    setProgress(0);
    setActive(false);
    setPlaying(false);
    currentRef.current.callbacks.frame?.(0);
    currentRef.current.callbacks.finish?.();
  }, [clearFrame]);

  const tick = useCallback(function tickFrame(now: number) {
    const { props: currentProps, callbacks: currentCallbacks } = currentRef.current;
    const duration = Math.max(100, numberParam(currentProps.params, 'duration', 2000));
    const elapsed = elapsedRef.current + now - startedRef.current;
    const next = Math.min(1, elapsed / duration);
    setProgress(next);
    currentCallbacks.frame?.(next);

    if (next >= 0.55) {
      reporterRef.current?.milestone('boundary-reached');
    }

    if (next === 1) {
      frameRef.current = null;
      reporterRef.current?.complete();
      setPlaying(false);
      currentCallbacks.finish?.();

      return;
    }

    frameRef.current = requestAnimationFrame(tickFrame);
  }, []);

  useImperativeHandle(props.ref, () => ({
    play: () => {
      clearFrame();
      setActive(true);
      setPlaying(true);

      if (!pausedRef.current) {
        currentRef.current.callbacks.finish?.();
        reporterRef.current?.cancel();
        reporterRef.current = session.runs.start(props.id);
        elapsedRef.current = 0;
        setProgress(0);
      } else {
        reporterRef.current?.resume();
      }

      pausedRef.current = false;
      startedRef.current = performance.now();
      frameRef.current = requestAnimationFrame(tick);
    },
    pause: () => {
      if (frameRef.current !== null) {
        elapsedRef.current += performance.now() - startedRef.current;
        pausedRef.current = true;
        reporterRef.current?.pause();
        setPlaying(false);
        clearFrame();
      }
    },
    stop,
  }), [props.id, session, clearFrame, stop, tick]);

  useLayoutEffect(() => {
    return () => {
      clearFrame();
      reporterRef.current?.cancel();
      currentRef.current.callbacks.finish?.();
    };
  }, [clearFrame]);

  return {
    progress, token, active, playing,
  };
};
