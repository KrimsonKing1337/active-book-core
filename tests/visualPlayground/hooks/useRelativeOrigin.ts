import type { RefObject } from 'react';

import { useLayoutEffect, useState } from 'react';

type RelativeOriginOptions = {
  source?: HTMLElement | null;
  target: RefObject<HTMLElement | null>;
  enabled?: boolean;
  x?: number;
  y?: number;
};

/** Addressed measurements belong only to this cross-region artwork, never ordinary surfaces. */
export const useRelativeOrigin = ({
  source,
  target,
  enabled = true,
  x = 0.5,
  y = 0.5,
}: RelativeOriginOptions) => {
  const [origin, setOrigin] = useState({
    x: 0, y: 0, radius: 0,
  });

  useLayoutEffect(() => {
    const element = target.current;

    if (!element || !enabled) {
      return;
    }

    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const sourceBounds = source?.getBoundingClientRect() ?? bounds;
      const nextX = sourceBounds.left - bounds.left + sourceBounds.width * x;
      const nextY = sourceBounds.top - bounds.top + sourceBounds.height * y;

      setOrigin({
        x: nextX,
        y: nextY,
        radius: Math.hypot(Math.max(nextX, bounds.width - nextX), Math.max(nextY, bounds.height - nextY)),
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    if (source) {
      observer.observe(source);
    }

    measure();

    return () => observer.disconnect();
  }, [source, target, enabled, x, y]);

  return origin;
};
