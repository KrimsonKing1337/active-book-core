import type { HowlInst, HowlInstances } from '@types';

export type DeleteAudioInstancePayload = string | {
  id: string;
  instance: NonNullable<HowlInst>;
};

export interface State {
  audioInstances: HowlInstances;
  isDeleting: boolean;
}
