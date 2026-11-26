import { type RefObject, useMemo } from 'react';

import { type SettlePageResource, usePageResource } from './usePageResource';

export const useMediaReadiness = (
  ref: RefObject<HTMLImageElement | HTMLVideoElement | null>,
  source: string | undefined,
) => {
  const prepare = useMemo(() => {
    if (!source?.trim()) {
      return null;
    }

    let previous: {
      element: HTMLImageElement | HTMLVideoElement;
      outcome: 'ready' | 'failed'
    } | undefined;

    return (settle: SettlePageResource) => {
      const element = ref.current;

      if (!element) {
        settle('cancelled');

        return;
      }

      if (previous?.element === element) {
        settle(previous.outcome);

        return;
      }

      const image = element instanceof HTMLImageElement;
      const loaded = image ? element.complete : element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
      const sameSource = !element.currentSrc || element.currentSrc === element.src;

      const finish = (outcome: 'ready' | 'failed') => {
        previous = { element, outcome };
        settle(outcome);
      };

      if (sameSource && (loaded || (!image && element.error))) {
        const failed = image ? element.naturalWidth === 0 : !!element.error;

        finish(failed ? 'failed' : 'ready');

        return;
      }

      const readyEvent = image ? 'load' : 'loadeddata';
      const ready = () => finish('ready');
      const error = () => finish('failed');

      element.addEventListener(readyEvent, ready);
      element.addEventListener('error', error);
      if (!image) {
        element.addEventListener('canplay', ready);
      }

      return () => {
        element.removeEventListener(readyEvent, ready);
        element.removeEventListener('error', error);
        if (!image) {
          element.removeEventListener('canplay', ready);
        }
      };
    };
  }, [ref, source]);

  usePageResource(prepare);
};
