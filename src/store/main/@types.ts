import type { TableOfContents } from '@types';

export type FlashlightState = false | 'js' | 'cordova';

export type PageVisit = {
  id: number;
  pageId: string | null;
  primaryCommitted: boolean;
  failedResources: number;
  pendingResources: Record<string, true>;
  reveal: boolean;
  presentedAt: number | null;
};

export type PageResourceOutcome = 'ready' | 'failed' | 'cancelled';

export type PageResource = {
  visitId: number;
  resourceId: string;
};

export interface State {
  bookSessionId: string | null;
  visitSequence: number;
  visit: PageVisit | null;
  showLoader: boolean;
  id: string;
  pageId: string | null;
  pageIds: string[];
  authorComments: number;
  allPagesSeen: boolean;
  tableOfContents: TableOfContents;
  isVibrationAvailable: boolean | null;
  isFlashlightAvailable: FlashlightState | null;
  flashlightProblems: string;
  isAudioUnlocked: boolean;
}
