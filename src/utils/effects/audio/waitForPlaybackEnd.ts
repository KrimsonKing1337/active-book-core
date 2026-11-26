import type { Howl } from 'howler';

type Playback = {
  howl: Howl;
  soundIds: ReadonlySet<number>;
};

const events = [
  'end',
  'stop',
  'pause',
  'rate',
  'seek',
  'playerror',
] as const;

/** Observe completion without imposing a wall-clock limit on a playing or buffering clip. */
export const waitForPlaybackEnd = ({ howl, soundIds }: Playback) => {
  const playingIds = [...soundIds].filter((id) => howl.playing(id));
  let resolve = () => {};
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finished = false;

  const finish = () => {
    if (finished) {
      return;
    }

    finished = true;
    clearTimeout(timer);
    howl.off('loaderror', finish);

    for (const event of events) {
      howl.off(event, check);
    }

    resolve();
  };

  const check = () => {
    if (finished) {
      return;
    }

    clearTimeout(timer);
    let remaining = 0;
    let isPlaying = false;

    for (const id of playingIds) {
      if (!howl.playing(id)) {
        continue;
      }

      const rate = howl.rate(id);
      const position = howl.seek(id);
      const duration = howl.duration(id);

      if (Number.isFinite(position) && Number.isFinite(duration) && duration > 0 && position >= duration) {
        continue;
      }

      isPlaying = true;

      if (Number.isFinite(rate) && rate > 0 && Number.isFinite(position) && Number.isFinite(duration)) {
        remaining = Math.max(remaining, (duration - position) * 1000 / rate);
      }
    }

    if (isPlaying) {
      // The watchdog only rechecks playback. A stalled browser may legitimately take longer.
      const interval = Math.max(50, Math.min(remaining, 2_147_483_647));
      timer = setTimeout(check, interval);
    } else {
      finish();
    }
  };

  for (const id of playingIds) {
    if (howl.loop(id)) {
      howl.loop(false, id);
    }
  }

  for (const event of events) {
    howl.on(event, check);
  }

  howl.on('loaderror', finish);
  check();

  return { promise, cancel: finish };
};
