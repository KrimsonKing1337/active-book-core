import type { RootState } from '@store';
import type { PageVisit, State as MainState } from '@store/main/@types';

import { store } from '@store';

import { mainSelectors } from '@store/main';
import { audioEffectsActions } from '@store/effects/audio/audio';

import { isEffectActive } from '@utils/effects/lifetime';

import type { AudioDescription, PageAudioDescription } from './descriptions';

import { AudioActivation } from './AudioActivation';
import { describeAudio } from './descriptions';
import { removeOwnedAudio } from './ownedAudio';
import { RetiringAudio } from './RetiringAudio';

type PageRegistration = {
  description: PageAudioDescription;
  visitId: number;
};

type RelativeVolumeChange = {
  id: string;
  identity: string;
  relativeVolume: number;
};

export class BookAudio {
  private descriptions: readonly AudioDescription[] = [];
  private readonly pageRegistrations = new Set<PageRegistration>();
  private readonly active = new Map<string, AudioActivation>();
  private readonly retiring = new RetiringAudio((activation) => this.dispose(activation));
  private readonly removed = new Map<string, string>();
  private unsubscribe?: () => void;
  private lastSyncedMain?: MainState;
  private isAutoplayEnabled = false;
  private isSyncing = false;
  private needsSync = false;

  constructor(private readonly sessionId: string) {}

  start() {
    this.unsubscribe = store.subscribe(this.handleStoreChange);
    this.sync();
  }

  configure(descriptions: readonly AudioDescription[], isAutoplayEnabled: boolean) {
    if (this.descriptions === descriptions && this.isAutoplayEnabled === isAutoplayEnabled) {
      return;
    }

    this.descriptions = descriptions;
    this.isAutoplayEnabled = isAutoplayEnabled;

    this.sync();
  }

  registerPageAudio(registration: PageRegistration) {
    const { id, src } = registration.description;

    if (!id || !src) {
      return;
    }

    this.pageRegistrations.add(registration);

    this.sync();

    return () => {
      this.pageRegistrations.delete(registration);

      this.sync();
    };
  }

  setRelativeVolume({
    id,
    identity,
    relativeVolume,
  }: RelativeVolumeChange) {
    const activation = this.active.get(id);

    if (activation?.identity === identity) {
      activation.setRelativeVolume(relativeVolume);
    }
  }

  private handleStoreChange = () => {
    const state = store.getState();

    this.updateRetiringVolume(state.volume);

    const { main } = state;
    const previousMain = this.lastSyncedMain;

    if (!previousMain) {
      this.sync();

      return;
    }

    const hasSessionChanged = main.bookSessionId !== previousMain.bookSessionId;
    const hasPagesChanged = main.pageIds !== previousMain.pageIds;
    const hasVisitChanged = main.visit?.id !== previousMain.visit?.id;
    const hasPresentationChanged = main.visit?.presentedAt !== previousMain.visit?.presentedAt;
    const hasUnlockChanged = main.isAudioUnlocked !== previousMain.isAudioUnlocked;

    const needsReconciliation =
      hasSessionChanged
      || hasPagesChanged
      || hasVisitChanged
      || hasPresentationChanged
      || hasUnlockChanged;

    if (needsReconciliation) {
      this.sync();
    }
  };

  private volume = store.getState().volume;

  private updateRetiringVolume(volume: RootState['volume']) {
    if (volume === this.volume) {
      return;
    }

    const previous = this.volume;
    this.volume = volume;

    for (const { audio } of this.retiring.activations) {
      const { type } = audio;

      if (volume.global !== previous.global || volume[type] !== previous[type]) {
        audio.volume(volume[type] / 100);
      }
    }
  }

  private sync() {
    // Read navigation again if registration or an author callback dispatched during reconciliation.
    this.needsSync = true;

    if (this.isSyncing || !this.unsubscribe) {
      return;
    }

    this.isSyncing = true;

    try {
      while (this.needsSync) {
        this.needsSync = false;

        const state = store.getState();
        const { main } = state;

        if (main.bookSessionId !== this.sessionId || !main.visit) {
          this.close();

          return;
        }

        if (this.lastSyncedMain?.visit?.id !== main.visit.id) {
          this.removed.clear();
        }

        this.lastSyncedMain = main;

        this.reconcile(main.visit, mainSelectors.page(state));
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private reconcile(visit: PageVisit, page: number) {
    const activationsToFade: AudioActivation[] = [];
    const desiredDescriptions = this.getDescriptions(visit, page);

    for (const [idCur, activationCur] of this.active) {
      const description = desiredDescriptions.get(idCur);
      const identity = description && describeAudio(description);

      if (description && identity === activationCur.identity) {
        activationCur.updateDescription(description);

        continue;
      }

      this.active.delete(idCur);
      this.unpublish(activationCur);
      this.leave(activationCur, activationsToFade);
    }

    for (const [idCur, descriptionCur] of desiredDescriptions) {
      const identity = describeAudio(descriptionCur);
      const wasRemoved = this.removed.get(idCur) === identity;

      if (wasRemoved) {
        continue;
      }

      const activation = this.active.get(idCur) ?? this.enter(descriptionCur, identity);

      activation.prepare(visit.id);

      const isActive = this.isActive(activation);

      if (visit.presentedAt !== null && isActive) {
        activation.timeline.present(visit.presentedAt);
      }

      activation.timeline.update();
    }

    this.retiring.fadeOut(activationsToFade);
  }

  private getDescriptions(visit: PageVisit, page: number) {
    const desiredDescriptions = new Map<string, AudioDescription>();

    for (const descriptionCur of this.descriptions) {
      if (isEffectActive(descriptionCur.lifetime, page)) {
        desiredDescriptions.set(descriptionCur.id, descriptionCur);
      }
    }

    for (const { description, visitId } of this.pageRegistrations) {
      const isCurrentVisit = visitId === visit.id;
      const isOnPage = isEffectActive(description.lifetime, page);

      if (isCurrentVisit && isOnPage && !desiredDescriptions.has(description.id)) {
        desiredDescriptions.set(description.id, description);
      }
    }

    return desiredDescriptions;
  }

  private enter(description: AudioDescription, identity: string) {
    for (const activationCur of this.retiring.activations) {
      if (activationCur.identity !== identity) {
        continue;
      }

      if (this.retiring.restore(activationCur)) {
        activationCur.updateDescription(description);
        this.publish(activationCur);

        return activationCur;
      }
    }

    const activation = new AudioActivation({
      description,
      identity,
      isActive: this.isActive,
      canAutoplay: this.canAutoplay,
      stop: this.stop,
      remove: this.handleUnload,
    });

    this.publish(activation);

    return activation;
  }

  private isActive = (activation: AudioActivation) => {
    const { id, lifetime } = activation.description;
    const state = store.getState();

    const isCurrentSession = state.main.bookSessionId === this.sessionId;
    const isCurrentActivation = this.active.get(id) === activation;

    if (!isCurrentSession || !isCurrentActivation || activation.audio.isUnloading) {
      return false;
    }

    const currentPage = mainSelectors.page(state);

    return isEffectActive(lifetime, currentPage);
  };

  private canAutoplay = (activation: AudioActivation) => {
    const isActive = this.isActive(activation);
    const { isAudioUnlocked } = store.getState().main;

    return isActive && this.isAutoplayEnabled && isAudioUnlocked;
  };

  private publish(activation: AudioActivation) {
    const { audio } = activation;

    this.active.set(audio.id, activation);

    removeOwnedAudio.set(audio, () => this.remove(activation));

    store.dispatch(audioEffectsActions.setAudioInstance(audio));
  }

  private unpublish({ audio }: AudioActivation) {
    store.dispatch(audioEffectsActions.unregisterAudioInstance({ id: audio.id, instance: audio }));
  }

  private leave(activation: AudioActivation, activationsToFade: AudioActivation[]) {
    activation.leave();

    const {
      audio,
      description,
      timeline,
    } = activation;

    if (!audio.hasCurrentPlayback()) {
      this.dispose(activation);
    } else if (description.waitTillTheEnd && !timeline.hasReachedStop) {
      this.retiring.waitForEnd(activation);
    } else if (description.fadeOut) {
      activationsToFade.push(activation);
    } else {
      this.dispose(activation);
    }
  }

  private stop = (activation: AudioActivation) => {
    if (this.isActive(activation)) {
      void activation.audio.stop(activation.description.fadeOut);

      return;
    }

    if (!this.retiring.has(activation) || this.retiring.isFading(activation)) {
      return;
    }

    if (activation.description.fadeOut && activation.audio.hasCurrentPlayback()) {
      this.retiring.fadeOut([activation]);
    } else {
      this.dispose(activation);
    }
  };

  private remove(activation: AudioActivation) {
    const { id } = activation.audio;

    if (this.active.get(id) === activation) {
      this.removed.set(id, activation.identity);
      this.dispose(activation);
    }
  }

  private handleUnload = (activation: AudioActivation) => {
    if (this.active.get(activation.audio.id) === activation) {
      this.remove(activation);
    } else if (this.retiring.has(activation)) {
      this.dispose(activation);
    }
  };

  private dispose(activation: AudioActivation) {
    const { audio } = activation;
    this.retiring.remove(activation);

    if (this.active.get(audio.id) === activation) {
      this.active.delete(audio.id);
      this.unpublish(activation);
    }

    removeOwnedAudio.delete(audio);
    activation.dispose();
  }

  close() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;

    this.lastSyncedMain = undefined;
    this.removed.clear();

    for (const activationCur of this.active.values()) {
      this.dispose(activationCur);
    }

    for (const activationCur of this.retiring.activations) {
      this.dispose(activationCur);
    }
  }
}
