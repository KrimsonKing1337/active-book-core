import type { AudioEffect } from '@active-book/types';

import type { RootState } from '@store';
import type { PageVisit, State as MainState } from '@store/main/@types';

import { store } from '@store';

import { mainSelectors } from '@store/main';
import { audioEffectsActions } from '@store/effects/audio/audio';

import { isEffectActive } from '@utils/effects/lifetime';

import { AudioActivation } from './AudioActivation';
import { RetiringAudio } from './RetiringAudio';
import { removeOwnedAudio } from './ownedAudio';

import type { AudioDescription } from './descriptions';

import { describeAudio, normalizeAudioDescription } from './descriptions';

type DesiredAudio = {
  description: AudioDescription;
  identity: string;
};

export class BookAudio {
  private descriptions: readonly AudioDescription[] = [];
  private configuredDescriptions?: readonly AudioEffect<number>[];
  private readonly active = new Map<string, AudioActivation>();
  private readonly removed = new Map<string, string>();
  private readonly retiring = new RetiringAudio(this.dispose.bind(this));
  private removalVisitId?: number;
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

  configure(descriptions: readonly AudioEffect<number>[], isAutoplayEnabled: boolean) {
    if (this.configuredDescriptions === descriptions && this.isAutoplayEnabled === isAutoplayEnabled) {
      return;
    }

    const ids = new Set<string>();
    const { audioInstances } = store.getState().audioEffects;

    for (const descriptionCur of descriptions) {
      const { id, src } = descriptionCur;

      const hasId = typeof id === 'string' && !!id.trim();
      const hasSource = typeof src === 'string' && !!src.trim();

      if (!hasId || !hasSource) {
        throw new Error('Each book audio effect needs a nonempty ID and source');
      }

      if (Object.hasOwn(Object.prototype, id)) {
        throw new Error(`Audio ID "${id}" is reserved`);
      }

      if (ids.has(id)) {
        throw new Error(`Duplicate book audio ID "${id}"`);
      }

      const existing = audioInstances[id];

      if (existing && this.active.get(id)?.audio !== existing) {
        throw new Error(`Audio ID "${id}" is already registered`);
      }

      ids.add(id);
    }

    this.descriptions = descriptions.map(normalizeAudioDescription);
    this.configuredDescriptions = descriptions;
    this.isAutoplayEnabled = isAutoplayEnabled;

    this.sync();
  }

  hasDescription(id: string) {
    return this.descriptions.some((descriptionCur) => descriptionCur.id === id);
  }

  private handleStoreChange = () => {
    const state = store.getState();
    const { main } = state;

    this.updateRetiringVolume(state.volume);

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

        this.resetRemovals(main.visit.id);

        this.lastSyncedMain = main;

        this.reconcile(main.visit, mainSelectors.page(state));
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private isCurrentVisit(visitId: number) {
    const { bookSessionId, visit } = store.getState().main;

    return !!this.unsubscribe && bookSessionId === this.sessionId && visit?.id === visitId;
  }

  private reconcile(visit: PageVisit, page: number) {
    const activationsToFade: AudioActivation[] = [];
    const desiredAudio = this.getDesiredAudio(page);

    try {
      for (const [idCur, activationCur] of this.active) {
        if (!this.isCurrentVisit(visit.id) || this.needsSync) {
          return;
        }

        const desiredEntry = desiredAudio.get(idCur);

        if (desiredEntry?.identity === activationCur.identity) {
          activationCur.updateDescription(desiredEntry.description);

          continue;
        }

        // From this point close() must be able to find the activation even during unpublish.
        this.retiring.track(activationCur);
        this.active.delete(idCur);
        this.unpublish(activationCur);

        if (this.retiring.has(activationCur)) {
          this.leave(activationCur, activationsToFade);
        }
      }

      for (const entryCur of desiredAudio.values()) {
        if (!this.isCurrentVisit(visit.id) || this.needsSync) {
          return;
        }

        const { description, identity } = entryCur;
        const { id } = description;

        if (this.removed.get(id) === identity) {
          continue;
        }

        const activation = this.active.get(id) ?? this.enter(entryCur, visit.id);

        if (!activation || !this.isActive(activation)) {
          continue;
        }

        activation.prepare(visit.id);

        if (!this.isCurrentVisit(visit.id) || this.needsSync) {
          return;
        }

        if (visit.presentedAt !== null && this.isActive(activation)) {
          activation.timeline.present(visit.presentedAt);
        }

        activation.timeline.update();
      }
    } finally {
      this.retiring.fadeOut(activationsToFade);
    }
  }

  private getDesiredAudio(page: number) {
    const desiredAudio = new Map<string, DesiredAudio>();

    for (const descriptionCur of this.descriptions) {
      if (isEffectActive(descriptionCur.lifetime, page)) {
        const identity = describeAudio(descriptionCur);

        desiredAudio.set(descriptionCur.id, {
          description: descriptionCur,
          identity,
        });
      }
    }

    return desiredAudio;
  }

  private enter(entry: DesiredAudio, visitId: number) {
    const { description, identity } = entry;

    const existing = store.getState().audioEffects.audioInstances[description.id];

    if (existing) {
      throw new Error(`Audio ID "${description.id}" is already registered`);
    }

    for (const activationCur of this.retiring.activations) {
      if (activationCur.identity !== identity) {
        continue;
      }

      const restored = this.retiring.restore(activationCur);

      if (!this.isCurrentVisit(visitId) || this.needsSync) {
        if (restored) {
          this.dispose(activationCur);
        }

        return;
      }

      if (restored) {
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

    if (!this.retiring.has(activation)) {
      return;
    }

    const {
      audio,
      description,
      timeline,
    } = activation;

    if (!audio.hasCurrentPlayback()) {
      this.dispose(activation);
    } else if (audio.isHalting) {
      activationsToFade.push(activation);
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

  private resetRemovals(visitId?: number) {
    if (this.removalVisitId !== visitId) {
      this.removed.clear();
      this.removalVisitId = visitId;
    }
  }

  private remove(activation: AudioActivation) {
    const { id } = activation.audio;

    if (this.active.get(id) === activation) {
      this.resetRemovals(store.getState().main.visit?.id);
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
    this.resetRemovals();

    for (const activationCur of this.active.values()) {
      this.dispose(activationCur);
    }

    for (const activationCur of this.retiring.activations) {
      this.dispose(activationCur);
    }
  }
}
