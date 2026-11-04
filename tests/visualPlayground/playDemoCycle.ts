import type { VisualEffectRegistration } from '@active-book/types';

import type { VisualEffects } from '@controllers/visualEffects';

import type { Demo } from './@types';

import { playSequence } from './sequence';

type PlayDemoCycleOptions = {
  session: VisualEffects;
  registrations: readonly VisualEffectRegistration[];
  demo: Demo;
  signal: AbortSignal;
};

/** Execute one complete demonstration; loop/restart policy belongs to the Playground. */
export const playDemoCycle = async ({
  session,
  registrations,
  demo,
  signal,
}: PlayDemoCycleOptions): Promise<boolean> => {
  signal.throwIfAborted();

  if (demo === 'collapse' || demo === 'sequence') {
    await playSequence({
      session,
      signal,
      narrative: demo === 'sequence',
    });

    return true;
  }

  const runs = registrations.flatMap(({ effect }) => {
    const playback = session.getController(effect.id)?.playback;

    if (!playback) {
      return [];
    }

    playback.play();
    const run = session.runs.read(effect.id);

    if (!run) {
      throw new Error(`Effect did not start: ${effect.id}`);
    }

    return [run];
  });

  if (!runs.length) {
    return false;
  }

  await Promise.all(runs.map((run) => session.runs.wait(run, { signal })));

  return true;
};
