import { StrictMode } from 'react';

import { StoreProvider, store } from '@store';
import { effectsActions } from '@store/effects/common';

import { CarouselSlideActiveContext } from '@components/Carousel/context';

import { Video } from '../Video';
import { VideoPlaybackContext } from '../context';

type ViewOptions = {
  active?: boolean;
  autoPlay?: boolean;
  src?: string;
  dialog?: boolean;
  isCurrentWindow?: () => boolean;
};

const currentWindow = () => true;

export const videoView = ({
  active = true,
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
  store.dispatch(effectsActions.setVideosAmount(0));
  store.dispatch(effectsActions.setVideosReadyAmount(0));
  store.dispatch(effectsActions.setVideosCurrentTime({}));
};
