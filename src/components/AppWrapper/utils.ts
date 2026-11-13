import type { HowlInstances } from '@types';

import { store } from '@store';

import { handleVideoPlayError, reportUnexpectedVideoError } from '@components/Video/utils/errors';

export const setMuteToAllVideos = (muted: boolean) => {
  const videos = document.querySelectorAll('video');

  const { videos: videosVolume, global: globalVolume } = store.getState().volume;

  videos.forEach((videoCur) => {
    const volume = muted ? 0 : (videosVolume / 100);
    const relativeVolumeStr = videoCur.getAttribute('data-relativeVolume');
    const relativeVolume = Number(relativeVolumeStr) || 100;

    videoCur.volume = volume * (relativeVolume / 100) * (globalVolume / 100);
  });
};

export const startToPlayAllAudiosWithPlayOnLoad = (audioInstances: HowlInstances, page: number) => {
  Object.values(audioInstances).forEach((audio) => {
    if (!audio) {
      return;
    }
    if (audio.page !== page && !audio.isRange) {
      return;
    }
    if (audio.isUnloading) {
      return;
    }
    if (audio.playing()) {
      return;
    }
    if (!audio.playOnLoad) {
      return;
    }

    audio.play();
  });
};

export const startToPlayAllVideosWithPlayOnLoad = () => {
  const videos = Array.from(document.querySelectorAll('video'));

  videos.forEach((videoCur) => {
    const hasLocalOwner = videoCur.dataset.videoManaged === 'true'
      || videoCur.closest('[data-book-carousel], [data-video-scope="dialog"]');

    if (hasLocalOwner) {
      return;
    }

    const autoPlay = videoCur.getAttribute('data-autoPlay');

    if (autoPlay === 'true') {
      const source = videoCur.getAttribute('src');

      void videoCur.play().then(() => {
        if (!videoCur.isConnected && videoCur.getAttribute('src') === source) {
          videoCur.pause();
        }
      }).catch((error: unknown) => {
        if (videoCur.isConnected && videoCur.getAttribute('src') === source) {
          handleVideoPlayError(videoCur, error);
        } else {
          reportUnexpectedVideoError(source, error);
        }
      });
    }
  });
};
