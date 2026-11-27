import { handleVideoPlayError, reportUnexpectedVideoError } from './errors';

import {
  type VideoPlayback,
  type VideoPolicy,
  isVideoActive,
  pauseVideo,
} from './state';

const requestVideoPlay = (playback: VideoPlayback) => {
  const { element } = playback;

  const isPlaybackBlocked = !playback.wantsPlay || playback.pending;
  const isPlayingOrEnded = !element.paused || element.ended;

  if (isPlaybackBlocked || isPlayingOrEnded) {
    return;
  }

  playback.pending = true;
  playback.version += 1;

  const version = playback.version;
  const source = element.getAttribute('src');

  const reject = (error: unknown) => {
    if (playback.disposed || playback.version !== version) {
      reportUnexpectedVideoError(source, error);

      return;
    }

    playback.pending = false;

    const videoIsActive = isVideoActive(playback);

    if (!videoIsActive) {
      reportUnexpectedVideoError(source, error);

      return;
    }

    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      playback.wantsPlay = false;
    }

    handleVideoPlayError(element, error);
  };

  try {
    element.play().then(() => {
      if (playback.disposed) {
        return;
      }

      const videoIsActive = isVideoActive(playback);

      if ((!videoIsActive || !playback.wantsPlay) && !element.paused) {
        pauseVideo(playback);
      }

      if (playback.version === version) {
        playback.pending = false;
      }
    }).catch(reject);
  } catch (error) {
    reject(error);
  }
};

export const updateVideoPlayback = (playback: VideoPlayback, policy: VideoPolicy) => {
  const wasActive = playback.active;

  // A user pause changes paused synchronously, before its queued event is delivered.
  if (playback.managed && wasActive && playback.element.paused) {
    playback.wantsPlay = false;
  }

  Object.assign(playback, policy);

  if (!playback.managed && playback.initialized) {
    return;
  }

  const videoIsActive = isVideoActive(playback);

  if (!videoIsActive) {
    const isPlaying = !playback.element.paused;
    const shouldPause = wasActive || isPlaying || playback.pending;

    if (playback.managed && shouldPause) {
      pauseVideo(playback);
    }

    return;
  }

  if (!playback.initialized) {
    playback.initialized = true;
    playback.wantsPlay = playback.autoPlay;
  }

  requestVideoPlay(playback);
};
