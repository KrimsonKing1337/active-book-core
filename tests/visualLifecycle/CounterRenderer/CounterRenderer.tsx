import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import { getMetrics } from '../metrics';

export const CounterRenderer = ({
  id,
  params,
  geometry,
  ref,
}: VisualRendererProps) => {
  const [token] = useState(() => crypto.randomUUID());
  const [ticks, setTicks] = useState(0);
  const [isPlaying, setIsPlaying] = useState(params.autoPlay !== false);
  const playingRef = useRef(isPlaying);
  const [loadDelay] = useState(() => typeof params.loadDelay === 'number' ? params.loadDelay : 50);
  const step = typeof params.step === 'number' ? params.step : 1;
  const label = typeof params.label === 'string' ? params.label : '';

  useLayoutEffect(() => {
    const metric = getMetrics(id);
    metric.mounts += 1;
    metric.liveResources += 1;
    metric.pendingLoads += 1;
    let isAlive = true;
    let isPending = true;
    const loadTimer = setTimeout(() => {
      isPending = false;
      metric.pendingLoads -= 1;
      metric.loads += 1;
      if (!isAlive) {
        metric.lateCallbacks += 1;
      }
    }, loadDelay);

    return () => {
      isAlive = false;
      clearTimeout(loadTimer);
      if (isPending) {
        metric.pendingLoads -= 1;
      }
      metric.liveResources -= 1;
      metric.unmounts += 1;
    };
  }, [id, loadDelay]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const metric = getMetrics(id);
    metric.activeTimers += 1;
    const timer = setInterval(() => {
      // A queued interval can run before React commits the stop and its passive cleanup.
      setTicks((previous) => playingRef.current ? previous + step : previous);
    }, 25);

    return () => {
      clearInterval(timer);
      metric.activeTimers -= 1;
    };
  }, [id, isPlaying, step]);

  useImperativeHandle(ref, () => ({
    play: () => {
      getMetrics(id).playCalls += 1;
      playingRef.current = true;
      setIsPlaying(true);
    },
    pause: () => {
      playingRef.current = false;
      setIsPlaying(false);
    },
    stop: () => {
      playingRef.current = false;
      setIsPlaying(false);
      setTicks(0);
    },
  }), [id]);

  return (
    <div
      data-counter={id}
      data-token={token}
      data-ticks={ticks}
      data-playing={String(isPlaying)}
      data-label={label}
      data-width={geometry.width}
      data-height={geometry.height}
      style={{
        width: '100%', height: '100%', background: 'linear-gradient(90deg, #4008, #0048)',
      }}
    >
      {ticks}
    </div>
  );
};
