import { store } from '@store';

import { setVideosVolume } from '@utils/volume/setVideosVolume';

export const setMuteToAllVideos = (muted: boolean) => {
  const { videos: videosVolume } = store.getState().volume;

  setVideosVolume(videosVolume, muted);
};
