import type { HowlInstances } from '@types';

import { store } from '@store';

import {
  getVideoStats,
  handleVideoPlayError,
  reportUnexpectedVideoError,
} from '@components/Video/utils';

const locallyManagedVideoSelector = '[data-book-carousel], [data-video-scope="dialog"]';

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

    if (audio.page !== page) {
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
    const videoIsManaged = videoCur.dataset.videoManaged === 'true';

    const hasLocalOwner = videoIsManaged || videoCur.closest(locallyManagedVideoSelector);

    if (hasLocalOwner) {
      return;
    }

    const autoPlay = videoCur.getAttribute('data-autoPlay');

    if (autoPlay === 'true') {
      const source = videoCur.getAttribute('src');

      videoCur.play().then(() => {
        const { isConnected, sourceIsEqual } = getVideoStats(videoCur, source);

        if (!isConnected && sourceIsEqual) {
          videoCur.pause();
        }
      }).catch((error: unknown) => {
        const { isConnected, sourceIsEqual } = getVideoStats(videoCur, source);

        if (isConnected && sourceIsEqual) {
          handleVideoPlayError(videoCur, error);
        } else {
          reportUnexpectedVideoError(source, error);
        }
      });
    }
  });
};
