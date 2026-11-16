import type { HowlInstances } from '@types';

import { store } from '@store';
import { setVideosVolume } from '@utils/volume/setVideosVolume';

import {
  getVideoStats,
  handleVideoPlayError,
  reportUnexpectedVideoError,
} from '@components/Video/utils';

const locallyManagedVideoSelector = '[data-book-carousel], [data-video-scope="dialog"]';

export const setMuteToAllVideos = (muted: boolean) => {
  const { videos: videosVolume } = store.getState().volume;

  setVideosVolume(videosVolume, muted);
};

export const startToPlayAllAudiosWithPlayOnLoad = (audioInstances: HowlInstances, page: number) => {
  Object.values(audioInstances).forEach((audioCur) => {
    if (!audioCur) {
      return;
    }

    if (audioCur.page !== page) {
      return;
    }

    if (audioCur.isUnloading) {
      return;
    }

    if (audioCur.playing()) {
      return;
    }

    if (!audioCur.playOnLoad) {
      return;
    }

    audioCur.play();
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
