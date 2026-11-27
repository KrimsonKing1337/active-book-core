import type { Howl } from 'howler';

type Playback = {
  howl: Howl;
  soundIds: ReadonlySet<number>;
};

const MIN_CHECK_DELAY_MS = 50;
// setTimeout uses a signed 32-bit delay in browsers.
const MAX_TIMEOUT_DELAY_MS = 2 ** 31 - 1;

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
  const allSoundIds = [...soundIds];

  const playingIds = allSoundIds.filter((idCur) => howl.playing(idCur));
  const loopingIds = playingIds.filter((idCur) => howl.loop(idCur));

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

    let maxRemainingMs = 0;
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
        const remainingMs = (duration - position) * 1000 / rate;

        maxRemainingMs = Math.max(maxRemainingMs, remainingMs);
      }
    }

    if (isPlaying) {
      // The watchdog only rechecks playback. A stalled browser may legitimately take longer.
      const cappedDelay = Math.min(maxRemainingMs, MAX_TIMEOUT_DELAY_MS);
      const checkDelay = Math.max(MIN_CHECK_DELAY_MS, cappedDelay);

      timer = setTimeout(check, checkDelay);
    } else {
      finish();
    }
  };

  for (const idCur of loopingIds) {
    howl.loop(false, idCur);
  }

  for (const eventCur of events) {
    howl.on(eventCur, check);
  }

  howl.on('loaderror', finish);

  check();

  const restore = () => {
    if (finished) {
      return false;
    }

    for (const idCur of loopingIds) {
      if (howl.playing(idCur)) {
        howl.loop(true, idCur);
      }
    }

    finish();

    return true;
  };

  return {
    promise,
    cancel: finish,
    restore,
  };
};
