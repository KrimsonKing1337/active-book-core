import { store } from '@store';

import { getMediaVolume } from '@utils/volume/getMediaVolume';

export const setVideosVolume = (volume: number, muted = document.hidden) => {
  const videos = document.querySelectorAll('video');
  const globalVolume = store.getState().volume.global / 100;
  let categoryVolume = volume / 100;

  if (muted) {
    categoryVolume = 0;
  }

  for (const videoCur of videos) {
    const relativeVolumeStr = videoCur.getAttribute('data-relativeVolume');
    let relativeVolume = 100;

    if (relativeVolumeStr !== null && relativeVolumeStr.trim() !== '') {
      const parsedVolume = Number(relativeVolumeStr);

      if (!Number.isNaN(parsedVolume)) {
        relativeVolume = parsedVolume;
      }
    }

    videoCur.volume = getMediaVolume({
      global: globalVolume,
      category: categoryVolume,
      relative: relativeVolume / 100,
    });
  }
};
