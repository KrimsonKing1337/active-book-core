import type { RefObject } from 'react';

import { useLayoutEffect, useState } from 'react';

import { useBookApplicationSurface } from '@components/BookApplicationSurface/context';

import type { StoryGeometry } from './@types';


import { getStoryGeometry } from './getStoryGeometry';

/** Observe a persistent root supplied by the host; no application-wide DOM registry is needed. */
export const useStoryGeometry = (storyRef: RefObject<HTMLElement | null>, enabled = true): StoryGeometry | null => {
  const application = useBookApplicationSurface();
  const applicationRef = application?.root;
  const applicationElement = application?.element;
  const [geometry, setGeometry] = useState<StoryGeometry | null>(null);

  useLayoutEffect(() => {
    const story = storyRef.current;

    if (!story || !enabled) {
      return;
    }

    let pendingFrame: number | null = null;
    let previousKey = '';
    let observedRegions: Element[] = [];

    const measure = () => {
      const next = getStoryGeometry(story, applicationRef?.current);
      const nextKey = JSON.stringify(next);

      if (previousKey !== nextKey) {
        previousKey = nextKey;

        setGeometry(next);
      }
    };

    const scheduleMeasurement = () => {
      if (pendingFrame === null) {
        pendingFrame = requestAnimationFrame(() => {
          pendingFrame = null;

          measure();
        });
      }
    };

    const resizeObserver = new ResizeObserver(scheduleMeasurement);

    const observeRegions = () => {
      const regions = Array.from(story.querySelectorAll('[data-story-region]'));

      const lengthIsSame = regions.length === observedRegions.length;

      const regionsIsSame = regions.every((regionCur, index) => {
        return regionCur === observedRegions[index];
      });

      const hasSameRegions = lengthIsSame && regionsIsSame;

      if (hasSameRegions) {
        return;
      }

      observedRegions = regions;

      resizeObserver.disconnect();
      resizeObserver.observe(story);
      if (applicationRef?.current) {
        resizeObserver.observe(applicationRef.current);
      }

      regions.forEach((regionCur) => resizeObserver.observe(regionCur));

      scheduleMeasurement();
    };

    // Navigation replaces region elements; text/media size changes use ResizeObserver instead.
    const mutationObserver = new MutationObserver(observeRegions);

    resizeObserver.observe(story);

    observeRegions();

    mutationObserver.observe(story, {
      childList: true,
      subtree: true,
    });

    story.addEventListener('scroll', scheduleMeasurement, true);
    window.addEventListener('resize', scheduleMeasurement);
    applicationElement?.addEventListener('visual-layout-change', scheduleMeasurement);

    measure();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();

      story.removeEventListener('scroll', scheduleMeasurement, true);
      window.removeEventListener('resize', scheduleMeasurement);
      applicationElement?.removeEventListener('visual-layout-change', scheduleMeasurement);

      if (pendingFrame !== null) {
        cancelAnimationFrame(pendingFrame);
      }
    };
  }, [storyRef, enabled, applicationRef, applicationElement]);

  return enabled ? geometry : null;
};
