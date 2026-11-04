export type RunStatus = 'running' | 'paused' | 'completed' | 'cancelled';

export type EffectRun = {
  readonly effectId: string;
  readonly number: number;
  readonly status: RunStatus;
  readonly milestones: readonly string[];
};

/** Rare semantic transitions, separate from authored descriptions and per-frame animation values. */
export const createEffectRuns = () => {
  const states = new Map<string, EffectRun>();
  const listeners = new Set<() => void>();
  let sequence = 0;
  let destroyed = false;

  const publish = () => listeners.forEach((listenerCur) => listenerCur());
  const read = (id: string) => states.get(id);
  const subscribe = (listener: () => void) => {
    if (destroyed) {
      return () => {};
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  const change = (run: EffectRun, status: RunStatus, milestone?: string) => {
    const current = states.get(run.effectId);

    const active = current?.status === 'running' || current?.status === 'paused';

    if (destroyed || current?.number !== run.number || !active) {
      return;
    }

    if (milestone && current.milestones.includes(milestone)) {
      return;
    }

    if (!milestone && current.status === status) {
      return;
    }

    const milestones = milestone ? [...current.milestones, milestone] : current.milestones;
    const next = Object.freeze({
      ...current, status, milestones: Object.freeze(milestones),
    });
    states.set(run.effectId, next);
    publish();
  };

  const cancel = (id: string) => {
    const current = read(id);

    if (current) {
      change(current, 'cancelled');
    }
  };

  const start = (effectId: string) => {
    if (destroyed) {
      throw new Error('Effect run session is destroyed');
    }

    cancel(effectId);
    const run: EffectRun = Object.freeze({
      effectId,
      number: ++sequence,
      status: 'running',
      milestones: Object.freeze([]),
    });
    states.set(effectId, run);
    publish();

    return {
      key: run,
      milestone: (name: string) => change(run, 'running', name),
      complete: () => change(run, 'completed'),
      cancel: () => change(run, 'cancelled'),
      pause: () => change(run, 'paused'),
      resume: () => change(run, 'running'),
    };
  };

  const wait = (run: EffectRun, options: {
    milestone?: string; signal: AbortSignal
  }) => {
    return new Promise<void>((resolve, reject) => {
      let unsubscribe = () => {};
      const cleanup = () => {
        unsubscribe();
        options.signal.removeEventListener('abort', abort);
      };
      const abort = () => {
        cleanup();
        reject(new DOMException('Effect wait cancelled', 'AbortError'));
      };
      const inspect = () => {
        const current = read(run.effectId);
        const sameRun = current?.number === run.number;

        if (!sameRun || current.status === 'cancelled') {
          abort();

          return;
        }

        const reached = options.milestone
          ? current.milestones.includes(options.milestone)
          : current.status === 'completed';

        if (reached) {
          cleanup();
          resolve();
        } else if (current.status === 'completed') {
          cleanup();
          reject(new Error(`Missing milestone: ${options.milestone}`));
        }
      };

      if (options.signal.aborted) {
        abort();

        return;
      }

      unsubscribe = subscribe(inspect);
      options.signal.addEventListener('abort', abort, { once: true });
      inspect();
    });
  };

  const retainActive = (ids: ReadonlySet<string>) => {
    states.forEach((runCur, id) => {
      if (!ids.has(id)) {
        cancel(runCur.effectId);
      }
    });
  };

  const cancelAll = () => states.forEach((runCur) => cancel(runCur.effectId));
  const forget = (id: string) => {
    cancel(id);
    states.delete(id);
    publish();
  };
  const destroy = () => {
    cancelAll();
    destroyed = true;
    listeners.clear();
    states.clear();
  };

  return {
    start,
    read,
    subscribe,
    wait,
    cancel,
    cancelAll,
    forget,
    retainActive,
    destroy,
    listenerCount: () => listeners.size,
  };
};
