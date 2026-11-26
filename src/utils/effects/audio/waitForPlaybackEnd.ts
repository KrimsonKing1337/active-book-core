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
  const soundsIdsCopy = [...soundIds];
  const playingIds = soundsIdsCopy.filter((id) => howl.playing(id));

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

    for (const eventCur of events) {
      howl.off(eventCur, check);
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

    for (const idCur of playingIds) {
      if (!howl.playing(idCur)) {
        continue;
      }

      const rate = howl.rate(idCur);
      const position = howl.seek(idCur);
      const duration = howl.duration(idCur);

      const positionIsValid = Number.isFinite(position);
      const durationIsValid = Number.isFinite(duration) && duration > 0;

      if (positionIsValid && durationIsValid && position >= duration) {
        continue;
      }

      isPlaying = true;

      const rateIsValid = Number.isFinite(rate) && rate > 0;

      if (rateIsValid && Number.isFinite(position) && Number.isFinite(duration)) {
        const delta = (duration - position) * 1000;
        const max = delta / rate;

        remaining = Math.max(remaining, max);
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

  for (const idCur of playingIds) {
    if (howl.loop(idCur)) {
      howl.loop(false, idCur);
    }
  }

  for (const eventCur of events) {
    howl.on(eventCur, check);
  }

  howl.on('loaderror', finish);

  check();

  return { promise, cancel: finish };
};
