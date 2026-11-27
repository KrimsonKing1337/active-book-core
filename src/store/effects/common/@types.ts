export interface State {
  inverseColorIsActive: boolean;

  videosCurrentTime: Record<string, number>;
}

export type VideoCurrentTime = {
  id: string;
  currentTime: number;
};
