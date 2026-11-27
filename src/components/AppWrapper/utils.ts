import { store } from '@store';

import { setVideosVolume } from '@utils/volume/setVideosVolume';

export const setMuteToAllVideos = (muted: boolean) => {
  const state = store.getState();
  const { videos: videosVolume } = state.volume;

  setVideosVolume(videosVolume, muted);
};
