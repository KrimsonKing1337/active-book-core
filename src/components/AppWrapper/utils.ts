import type { HowlInstances } from '@types';

import { store } from '@store';

import { setVideosVolume } from '@utils/volume/setVideosVolume';

export const setMuteToAllVideos = (muted: boolean) => {
  const { videos: videosVolume } = store.getState().volume;

  setVideosVolume(videosVolume, muted);
};

export type PageAudioAutoplay = {
  page: number;
  allowStart?: (instance: NonNullable<HowlInstances[string]>) => boolean;
};

export const startToPlayAllAudiosWithPlayOnLoad = (
  audioInstances: HowlInstances, {
    page,
    allowStart = () => true,
  }: PageAudioAutoplay) => {
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

    const canStart = allowStart(audioCur);
    const isPlaying = audioCur.playing();

    if (!audioCur.playOnLoad || !canStart || isPlaying) {
      return;
    }

    audioCur.play();
  });
};
