import type { PageResourceOutcome } from '@store/main/@types';

import type { PreparePageResource, SettlePageResource } from '@hooks/pagePresentation/registerPageResource';

import type { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

export class AudioResource {
  private outcome: PageResourceOutcome | null = null;
  private settleVisit: SettlePageResource | null = null;

  constructor(private readonly audio: HowlWrapper, private readonly onLoad: () => void) {
    const state = audio.state();

    if (state === 'loaded') {
      this.outcome = 'ready';
    } else if (state === 'unloaded') {
      this.outcome = 'failed';
    } else {
      audio.howlInst.once('load', this.handleLoad);
      audio.howlInst.once('loaderror', this.handleError);
    }
  }

  get isReady() {
    return this.outcome === 'ready';
  }

  private handleLoad = () => this.finish('ready');
  private handleError = () => this.finish('failed');

  private finish(outcome: PageResourceOutcome) {
    if (this.outcome !== null) {
      return;
    }

    this.outcome = outcome;
    this.audio.howlInst.off('load', this.handleLoad);
    this.audio.howlInst.off('loaderror', this.handleError);

    const settle = this.settleVisit;

    this.settleVisit = null;
    settle?.(outcome);

    if (outcome === 'ready') {
      this.onLoad();
    }
  }

  prepare: PreparePageResource = (settle) => {
    if (this.outcome !== null) {
      settle(this.outcome);

      return;
    }

    this.settleVisit = settle;

    return () => {
      if (this.settleVisit === settle) {
        this.settleVisit = null;
      }
    };
  };

  destroy() {
    this.finish('cancelled');
  }
}
