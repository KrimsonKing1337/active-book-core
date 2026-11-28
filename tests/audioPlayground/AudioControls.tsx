import { type ChangeEvent, useState } from 'react';

import {
  DEFAULT_AUDIO_RELATIVE_VOLUME,
  MAX_AUDIO_RELATIVE_VOLUME,
  MIN_AUDIO_RELATIVE_VOLUME,
} from '@@/audioVolume';

import { useDispatch, useSelector } from '@store';
import { volumeActions, volumeSelectors } from '@store/volume';

import { useAudioController } from '@hooks/effects';


import { effects } from './effects';
import { useAudioSample } from './hooks';

import * as styles from './AudioPlayground.module.scss';

export const AudioControls = () => {
  const [effectId, setEffectId] = useState('clock');
  const [withFade, setWithFade] = useState(true);
  const volume = useSelector(volumeSelectors.sfx);
  const dispatch = useDispatch();
  const {
    audio,
    play,
    pause,
    stop,
    setRelativeVolume,
  } = useAudioController(effectId);
  const sample = useAudioSample(audio);
  const canPlay = sample?.playback === 'ready' || sample?.playback === 'playing';

  const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    setEffectId(event.currentTarget.value);
  };

  const handleFadeToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setWithFade(event.currentTarget.checked);
  };

  const handleVolume = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(volumeActions.setSfx(event.currentTarget.valueAsNumber));
  };

  const handlePlay = () => {
    void play(withFade);
  };

  const handlePause = () => {
    void pause(withFade);
  };

  const handleStop = () => {
    void stop(withFade);
  };

  const handleRelativeVolume = (event: ChangeEvent<HTMLInputElement>) => {
    setRelativeVolume(event.currentTarget.valueAsNumber);
  };

  const relativeVolume = sample?.relativeVolume ?? DEFAULT_AUDIO_RELATIVE_VOLUME;

  return (
    <div className={styles.Controls}>
      <label className={styles.Field}>
        Эффект
        <select value={effectId} onChange={handleSelect}>
          {effects.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.Actions}>
        <button type="button" disabled={!canPlay} onClick={handlePlay}>
          Запустить
        </button>

        <button type="button" disabled={!audio} onClick={handlePause}>
          Пауза
        </button>

        <button type="button" disabled={!audio} onClick={handleStop}>
          Остановить
        </button>
      </div>

      <label className={styles.Check}>
        <input type="checkbox" checked={withFade} onChange={handleFadeToggle} />
        Плавные ручные команды
      </label>

      <label className={styles.Field}>
        Относительная громкость · {relativeVolume}%

        <input
          type="range"
          aria-label="Относительная громкость"
          min={MIN_AUDIO_RELATIVE_VOLUME}
          max={MAX_AUDIO_RELATIVE_VOLUME}
          value={relativeVolume}
          disabled={!audio}
          onChange={handleRelativeVolume}
        />
      </label>

      <label className={styles.Field}>
        Громкость SFX · {volume}%

        <input
          type="range"
          aria-label="Громкость SFX"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolume}
        />
      </label>
    </div>
  );
};
