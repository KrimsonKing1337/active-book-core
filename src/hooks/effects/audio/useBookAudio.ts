import {
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import type { AudioEffectOptions } from '@types';

import type { PageAudioDescription } from '@controllers/bookAudio/descriptions';

import { BookAudioContext } from '@controllers/bookAudio/context';
import { describeAudio } from '@controllers/bookAudio/descriptions';

import { usePageVisit } from '@hooks/pagePresentation/context';

export const useBookAudio = (options: AudioEffectOptions) => {
  const bookAudio = useContext(BookAudioContext);
  const visit = usePageVisit();
  const visitId = visit?.id;
  const canRegister = !!bookAudio && options.lifecycle !== 'manual';
  const {
    id,
    page,
    relativeVolume = 100,
    fadeOutWhenUnload = true,
  } = options;

  const latest = useRef(options);
  const description: PageAudioDescription = {
    ...options,
    pageId: visit?.pageId ?? null,
    lifetime: { type: 'page', page },
    fadeOut: fadeOutWhenUnload,

    onPlay: () => latest.current.onPlay?.(),
    onPause: () => latest.current.onPause?.(),
    onStop: () => latest.current.onStop?.(),
    onUnload: () => latest.current.onUnload?.(),
  };
  const identity = describeAudio(description);
  const latestDescription = useRef(description);

  useLayoutEffect(() => {
    latest.current = options;
    latestDescription.current = description;
  });

  useLayoutEffect(() => {
    if (bookAudio && canRegister && visitId !== undefined) {
      return bookAudio.registerPageAudio({ description: latestDescription.current, visitId });
    }
  }, [
    bookAudio,
    canRegister,
    visitId,
    identity,
  ]);

  useLayoutEffect(() => {
    if (bookAudio && canRegister) {
      bookAudio.setRelativeVolume({
        id,
        identity,
        relativeVolume,
      });
    }
  }, [
    bookAudio,
    canRegister,
    id,
    identity,
    relativeVolume,
  ]);

  return canRegister;
};
