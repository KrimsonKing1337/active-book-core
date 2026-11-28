export const MIN_AUDIO_RELATIVE_VOLUME = 0;
export const DEFAULT_AUDIO_RELATIVE_VOLUME = 100;
export const MAX_AUDIO_RELATIVE_VOLUME = 200;

export const isAudioRelativeVolume = (percent: unknown): percent is number => {
  return typeof percent === 'number'
    && Number.isFinite(percent)
    && percent >= MIN_AUDIO_RELATIVE_VOLUME
    && percent <= MAX_AUDIO_RELATIVE_VOLUME;
};

export function assertAudioRelativeVolume(percent: unknown): asserts percent is number {
  if (!isAudioRelativeVolume(percent)) {
    throw new RangeError(
      `relativeVolume must be between ${MIN_AUDIO_RELATIVE_VOLUME} and ${MAX_AUDIO_RELATIVE_VOLUME}`,
    );
  }
}
