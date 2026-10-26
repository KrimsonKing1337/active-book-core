export interface State {
  inverseColorIsActive: boolean;

  dotLottieAmount: number;
  dotLottieReadyAmount: number;

  imagesAmount: number;
  imagesReadyAmount: number;

  videosAmount: number;
  videosReadyAmount: number;
  videosCurrentTime: Record<string, number>;

  audiosAmount: number;
  audiosReadyAmount: number;
}

export type VideoCurrentTime = {
  id: string;
  currentTime: number;
};
