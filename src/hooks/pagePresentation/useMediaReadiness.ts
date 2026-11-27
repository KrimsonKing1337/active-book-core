import type { RefObject } from 'react';

import { useMemo } from 'react';

import type { SettlePageResource } from './usePageResource';

import { usePageResource } from './usePageResource';

type MediaElement = HTMLImageElement | HTMLVideoElement;
type MediaReadinessOutcome = 'ready' | 'failed';

type MediaReadinessResult = {
  element: MediaElement;
  outcome: MediaReadinessOutcome;
};

const getMediaOutcome = (element: MediaElement): MediaReadinessOutcome | undefined => {
  const { currentSrc, src } = element;

  if (currentSrc && currentSrc !== src) {
    return;
  }

  if (element instanceof HTMLImageElement) {
    if (!element.complete) {
      return;
    }

    if (element.naturalWidth === 0) {
      return 'failed';
    }

    return 'ready';
  }

  if (element.error) {
    return 'failed';
  }

  if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return 'ready';
  }

  return;
};

export const useMediaReadiness = (
  ref: RefObject<MediaElement | null>,
  source: string | undefined,
) => {
  const prepare = useMemo(() => {
    if (!source?.trim()) {
      return null;
    }

    let previousResult: MediaReadinessResult | undefined;

    return (settle: SettlePageResource) => {
      const element = ref.current;

      if (!element) {
        settle('cancelled');

        return;
      }

      if (previousResult?.element === element) {
        settle(previousResult.outcome);

        return;
      }

      const finish = (outcome: MediaReadinessOutcome) => {
        previousResult = { element, outcome };

        settle(outcome);
      };

      const outcome = getMediaOutcome(element);

      if (outcome !== undefined) {
        finish(outcome);

        return;
      }

      const isVideo = element instanceof HTMLVideoElement;

      let readyEvent = 'load';

      if (isVideo) {
        readyEvent = 'loadeddata';
      }

      const handleReady = () => finish('ready');
      const handleError = () => finish('failed');

      element.addEventListener(readyEvent, handleReady);
      element.addEventListener('error', handleError);

      if (isVideo) {
        element.addEventListener('canplay', handleReady);
      }

      return () => {
        element.removeEventListener(readyEvent, handleReady);
        element.removeEventListener('error', handleError);

        if (isVideo) {
          element.removeEventListener('canplay', handleReady);
        }
      };
    };
  }, [ref, source]);

  usePageResource(prepare);
};
