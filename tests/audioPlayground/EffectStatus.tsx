import type { AudioEffect, EffectLifetime } from '@active-book/types';

import { useAudioController } from '@hooks/effects';

import type { DemoEffect } from './effects';

import { type AudioSample, useAudioSample } from './hooks';

import * as styles from './AudioPlayground.module.scss';

const playbackLabels = {
  outside: 'Недоступен по ID',
  loading: 'Загрузка',
  failed: 'Ошибка загрузки',
  ready: 'Готов, не играет',
  playing: 'Играет',
};

const describeLifetime = (lifetime: EffectLifetime) => {
  if (lifetime.type === 'page') {
    return `Страница ${lifetime.page}`;
  }

  const intervals = lifetime.range.map(({ from, to }) => {
    if (from === to) {
      return String(from);
    }

    return `${from}–${to}`;
  });

  return `Диапазон ${intervals.join(', ')}`;
};

const describeOptions = (effect: AudioEffect<number>) => {
  const labels = [effect.type ?? 'sfx', `${effect.relativeVolume ?? 100}%`];

  if (effect.playOnLoad) {
    labels.push('автозапуск');
  } else {
    labels.push('ручной запуск');
  }

  if (effect.delay) {
    labels.push(`delay ${effect.delay} мс`);
  }

  if (effect.stopBy) {
    labels.push(`stopBy ${effect.stopBy} мс`);
  }

  if (effect.loop) {
    labels.push('loop');
  }

  if (effect.fadeIn) {
    labels.push('fadeIn');
  }

  if (effect.fadeOut) {
    labels.push('fadeOut');
  }

  if (effect.waitTillTheEnd) {
    labels.push('waitTillTheEnd');
  }

  return labels.join(' · ');
};

type EffectStatusProps = {
  effect: DemoEffect;
};

export const EffectStatus = ({ effect }: EffectStatusProps) => {
  const { audio } = useAudioController(effect.id);
  const sample = useAudioSample(audio);
  const position = sample?.position;
  let playback: AudioSample['playback'] | 'outside' = 'outside';
  let details = '—';

  if (audio) {
    playback = sample?.playback ?? 'loading';
  }

  if (sample) {
    details = `#${sample.instance}`;
  }

  if (position !== undefined) {
    details = `${details} · ${position.toFixed(1)} с`;
  }

  return (
    <li
      className={styles.Effect}
      data-effect={effect.id}
      data-instance={sample?.instance}
      data-playback={playback}
      data-position={position}
    >
      <div className={styles.EffectHeading}>
        <strong>
          {effect.label}
        </strong>

        <span className={styles.State}>
          {playbackLabels[playback]}
        </span>
      </div>

      <div>
        <code>
          {effect.id}
        </code>

        {' · '}
        {describeLifetime(effect.lifetime)}
        {' · '}
        {details}
      </div>

      <small>
        {describeOptions(effect)}
      </small>
    </li>
  );
};
