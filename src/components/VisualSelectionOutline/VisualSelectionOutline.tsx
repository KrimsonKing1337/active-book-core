import { useLayoutEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { useBookApplicationSurface } from '@components/BookApplicationSurface/context';

import * as styles from './VisualSelectionOutline.module.scss';

type Outline = {
  left: number;
  top: number;
  width: number;
  height: number;
  borderRadius: string;
};

type VisualSelectionOutlineProps = {
  item?: VisualSurfaceItem;
};

/** Only the selected DOM element and its clipping/positioning containers are measured. */
export const VisualSelectionOutline = ({ item }: VisualSelectionOutlineProps) => {
  const application = useBookApplicationSurface();
  const { elements } = useStoryRegions();
  const region = item?.placement.region;
  const localRegion = region === 'frame' ? 'narrativeFrame' : region;
  const element = localRegion === 'application' ? application?.element : elements[localRegion ?? 'story'];
  const root = application?.element ?? elements.story;
  const selectionHost = application?.hosts.selection ?? elements.story;
  const [outline, setOutline] = useState<Outline | null>(null);
  const hidden = !item || item.hidden;
  const scrollport = elements.narrativeViewport;

  useLayoutEffect(() => {
    if (hidden || !element || !root) {
      setOutline(null);

      return;
    }

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      if (element.getClientRects().length === 0) {
        setOutline(null);

        return;
      }

      const bounds = element.getBoundingClientRect();
      const rootBounds = root.getBoundingClientRect();
      let left = bounds.left;
      let top = bounds.top;
      let right = bounds.right;
      let bottom = bounds.bottom;

      if (region === 'narrativeContent' && scrollport) {
        const clip = scrollport.getBoundingClientRect();
        left = Math.max(left, clip.left);
        top = Math.max(top, clip.top);
        right = Math.min(right, clip.right);
        bottom = Math.min(bottom, clip.bottom);
      }

      setOutline({
        left: left - rootBounds.left,
        top: top - rootBounds.top,
        width: Math.max(0, right - left),
        height: Math.max(0, bottom - top),
        borderRadius: getComputedStyle(element).borderRadius,
      });
    };
    const schedule = () => {
      frame ??= requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    observer.observe(root);
    root.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    measure();

    return () => {
      observer.disconnect();
      root.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);

      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
  }, [element, root, scrollport, region, hidden]);

  if (hidden || !outline || !selectionHost || !item) {
    return null;
  }

  return createPortal(
    <div
      className={styles.Outline}
      style={outline}
      data-visual-selection={item.id}
      aria-hidden="true"
      inert
    />,
    selectionHost,
  );
};
