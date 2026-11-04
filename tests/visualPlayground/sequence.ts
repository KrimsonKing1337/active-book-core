import type { VisualEffects } from '@controllers/visualEffects';

/** Deliberately small preset runner: no authored graph or direct renderer-to-renderer calls. */
export const playSequence = async (options: {
  session: VisualEffects;
  signal: AbortSignal;
  narrative: boolean;
}) => {
  const {
    session,
    signal,
    narrative,
  } = options;
  const play = (id: string) => {
    signal.throwIfAborted();
    const playback = session.getController(id)?.playback;

    if (!playback) {
      throw new Error(`Effect is not active: ${id}`);
    }

    playback.play();
    const run = session.runs.read(id);

    if (!run) {
      throw new Error(`Effect did not start: ${id}`);
    }

    return run;
  };

  if (narrative) {
    const run = play('narrative-dark');
    await session.runs.wait(run, { milestone: 'boundary-reached', signal });
  }

  const curtain = play('curtain');
  await session.runs.wait(curtain, { signal });
  const collapse = play('collapse');
  await session.runs.wait(collapse, { signal });

  // The reveal starts opaque, then opens a hole while the completed curtain is reset.
  const reveal = play('reveal');
  session.getController('curtain')?.playback?.stop();
  session.getController('narrative-dark')?.playback?.stop();
  await session.runs.wait(reveal, { signal });
};
