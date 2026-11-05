import type { TableOfContents } from '@types';

export type MenuActiveState = null | 'menu' | 'tableOfContents' | 'achievementsProgress';

export type FlashlightState = false | 'js' | 'cordova';

export interface State {
  showLoader: boolean;
  id: string;
  pageId: string | null;
  pageIds: string[];
  authorComments: number;
  allPagesSeen: boolean;
  tableOfContents: TableOfContents;
  menuActiveState: MenuActiveState;
  isVibrationAvailable: boolean | null;
  isFlashlightAvailable: FlashlightState | null;
  flashlightProblems: string;
  isAudioUnlocked: boolean;
}
