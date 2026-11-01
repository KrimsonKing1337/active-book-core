import type { RefObject } from 'react';

import { useLayoutEffect, useState } from 'react';

import type { BookGeometry } from './@types';

import { getBookGeometry } from './getBookGeometry';

/** Observe a persistent root supplied by the host; no application-wide DOM registry is needed. */
export const useBookGeometry = (bookRef: RefObject<HTMLElement | null>, enabled = true): BookGeometry | null => {
  const [geometry, setGeometry] = useState<BookGeometry | null>(null);

  useLayoutEffect(() => {
    const book = bookRef.current;

    if (!book || !enabled) {
      return;
    }

    let pendingFrame: number | null = null;
    let previousKey = '';
    let observedRegions: Element[] = [];

    const measure = () => {
      const next = getBookGeometry(book);
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
      const regions = Array.from(book.querySelectorAll('[data-book-region]'));

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
      resizeObserver.observe(book);

      regions.forEach((regionCur) => resizeObserver.observe(regionCur));

      scheduleMeasurement();
    };

    // Navigation replaces region elements; text/media size changes use ResizeObserver instead.
    const mutationObserver = new MutationObserver(observeRegions);

    resizeObserver.observe(book);

    observeRegions();

    mutationObserver.observe(book, { childList: true, subtree: true });

    book.addEventListener('scroll', scheduleMeasurement, true);
    window.addEventListener('resize', scheduleMeasurement);

    measure();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();

      book.removeEventListener('scroll', scheduleMeasurement, true);
      window.removeEventListener('resize', scheduleMeasurement);

      if (pendingFrame !== null) {
        cancelAnimationFrame(pendingFrame);
      }
    };
  }, [bookRef, enabled]);

  return enabled ? geometry : null;
};
