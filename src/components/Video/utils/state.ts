export type VideoPolicy = {
  active: boolean;
  managed: boolean;
  autoPlay: boolean;
  resetOnDispose: boolean;
  isCurrentWindow?: () => boolean;
};

export type VideoPlayback = VideoPolicy & {
  element: HTMLVideoElement;
  connected: boolean;
  disposed: boolean;
  initialized: boolean;
  wantsPlay: boolean;
  pending: boolean;
  version: number;
  ignoredPauses: number;
};

export const createVideoPlayback = (element: HTMLVideoElement): VideoPlayback => ({
  element,
  active: false,
  managed: false,
  autoPlay: false,
  resetOnDispose: false,
  connected: false,
  disposed: false,
  initialized: false,
  wantsPlay: false,
  pending: false,
  version: 0,
  ignoredPauses: 0,
});

export const isVideoActive = (playback: VideoPlayback): boolean => {
  const isMounted = playback.connected && playback.element.isConnected;

  if (!isMounted || playback.disposed || !playback.active) {
    return false;
  }

  return !playback.isCurrentWindow || playback.isCurrentWindow();
};

export const pauseVideo = (playback: VideoPlayback) => {
  if (!playback.element.paused) {
    // Native pause events are queued; keep the marker until the event arrives.
    playback.ignoredPauses += 1;
  }

  playback.version += 1;
  playback.pending = false;
  playback.element.pause();
};

export const disposeVideo = (playback: VideoPlayback) => {
  if (playback.disposed) {
    return;
  }

  playback.disposed = true;
  playback.element.pause();

  if (!playback.element.isConnected && playback.resetOnDispose) {
    playback.element.currentTime = 0;
    playback.element.removeAttribute('src');
    playback.element.load();
  }
};
