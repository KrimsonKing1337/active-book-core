import { StrictMode } from 'react';

import { StoreProvider, store } from '@store';
import { mainActions, mainSelectors } from '@store/main';

import { effectsActions } from '@store/effects/common';

import { BookPresentationContext } from '@hooks/pagePresentation/context';


import { CarouselSlideActiveContext } from '@components/Carousel/context';

import { Video } from '../Video';
import { VideoPlaybackContext } from '../context';

type ViewOptions = {
  active?: boolean;
  session?: string;
  autoPlay?: boolean;
  src?: string;
  dialog?: boolean;
  isCurrentWindow?: () => boolean;
};

const currentWindow = () => true;

export const videoView = ({
  active = true,
  session,
  autoPlay = true,
  src = 'first.webm',
  dialog = false,
  isCurrentWindow = currentWindow,
}: ViewOptions = {}) => {
  let scope = null;

  if (dialog) {
    scope = { isCurrentWindow };
  }

  return (
    <StrictMode>
      <StoreProvider>
        <BookPresentationContext value={session ?? null}>
          <VideoPlaybackContext value={scope}>
            <CarouselSlideActiveContext value={active}>
              <Video
                id="playback-test"
                src={src}
                autoPlay={autoPlay}
                controls={false}
              />
            </CarouselSlideActiveContext>
          </VideoPlaybackContext>
        </BookPresentationContext>
      </StoreProvider>
    </StrictMode>
  );
};

export const videoElement = () => {
  const video = document.querySelector('video');

  if (!video) {
    throw new Error('Missing test video');
  }

  return video;
};

export const resetReadiness = () => {
  store.dispatch(mainActions.closeBookSession(videoSession));
  store.dispatch(effectsActions.setVideosCurrentTime({}));
};


export const videoSession = 'video-test';

export const preparePage = () => {
  store.dispatch(mainActions.openBookSession({
    sessionId: videoSession,
    pageIds: ['first', 'second'],
    initialPage: 'first',
  }));
};

export const presentPage = () => {
  const visitId = mainSelectors.visitId(store.getState());

  if (visitId === null) {
    throw new Error('Missing test visit');
  }

  videoElement().dispatchEvent(new Event('loadeddata'));
  store.dispatch(mainActions.setPrimaryCommitted({ visitId, committed: true }));
  store.dispatch(mainActions.allowPageReveal(visitId));
  store.dispatch(mainActions.presentPage({ visitId, time: performance.now() }));
};
