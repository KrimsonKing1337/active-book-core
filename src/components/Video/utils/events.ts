import type { VideoPlayback } from './state';

import { isVideoActive, pauseVideo } from './state';

export const listenVideoPlayback = (playback: VideoPlayback) => {
  const { element } = playback;

  const handlePlay = () => {
    if (!playback.connected || playback.disposed) {
      return;
    }

    if (!isVideoActive(playback)) {
      pauseVideo(playback);

      return;
    }

    if (!element.paused) {
      playback.initialized = true;
      playback.wantsPlay = true;
      // Accepted native play is a newer intent than a still-pending request.
      playback.version += 1;
      playback.pending = false;
    }
  };

  const handlePause = () => {
    if (!playback.connected || playback.disposed) {
      return;
    }

    if (playback.ignoredPauses > 0) {
      playback.ignoredPauses -= 1;

      return;
    }

    if (element.paused) {
      playback.wantsPlay = false;
      playback.pending = false;
      playback.version += 1;
    }
  };

  const handleEnded = () => {
    if (!playback.connected || playback.disposed) {
      return;
    }

    playback.wantsPlay = false;
    playback.pending = false;
    playback.version += 1;
  };

  element.addEventListener('play', handlePlay);
  element.addEventListener('pause', handlePause);
  element.addEventListener('ended', handleEnded);

  return () => {
    element.removeEventListener('play', handlePlay);
    element.removeEventListener('pause', handlePause);
    element.removeEventListener('ended', handleEnded);
  };
};
