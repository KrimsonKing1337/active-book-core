type Source = string | null;

export type GetVideoStatsReturns = {
  isConnected: boolean;
  sourceIsEqual: boolean;
};

export const getVideoStats = (video: HTMLVideoElement, source: Source): GetVideoStatsReturns => {
  const sourceIsEqual = video.getAttribute('src') === source;

  return {
    isConnected: video.isConnected,
    sourceIsEqual,
  };
};
