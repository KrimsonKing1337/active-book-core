import type { HowlInst, HowlInstances } from '@types';

export type RemoveAudioInstancePayload = {
  id: string;
  instance: NonNullable<HowlInst>;
};

export interface State {
  audioInstances: HowlInstances;
}
