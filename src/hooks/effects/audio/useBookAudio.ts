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

  const latestOptions = useRef(options);

  const lifetime: PageAudioDescription['lifetime'] = {
    type: 'page',
    page,
  };

  const description: PageAudioDescription = {
    ...options,
    pageId: visit?.pageId ?? null,
    lifetime,
    fadeOut: fadeOutWhenUnload,

    onPlay: () => latestOptions.current.onPlay?.(),
    onPause: () => latestOptions.current.onPause?.(),
    onStop: () => latestOptions.current.onStop?.(),
    onUnload: () => latestOptions.current.onUnload?.(),
  };

  const identity = describeAudio(description);

  const latestDescription = useRef(description);

  useLayoutEffect(() => {
    latestOptions.current = options;
    latestDescription.current = description;
  });

  useLayoutEffect(() => {
    if (bookAudio && canRegister && visitId !== undefined) {
      return bookAudio.registerPageAudio({
        description: latestDescription.current,
        visitId,
      });
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
