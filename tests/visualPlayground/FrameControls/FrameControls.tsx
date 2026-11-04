import type { Settings } from '../@types';

import * as styles from './FrameControls.module.scss';

type FrameControlsProps = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
};

export const FrameControls = ({ settings, onChange }: FrameControlsProps) => {
  return (
    <fieldset className={styles.FrameControls}>
      <legend>
        CSS / JS comparison
      </legend>

      <label>
        Размещение
        <select
          value={settings.layout}
          onChange={(e) => onChange({ layout: e.target.value as Settings['layout'] })}
        >
          <option value="geometry">Текущий JS</option>
          <option value="css">Чистый CSS-layout</option>
          <option value="hybrid">Гибрид с явным JS для custom</option>
        </select>
      </label>

      <label>
        Плоскость рамки
        <select
          value={settings.plane}
          onChange={(e) => onChange({ plane: e.target.value as Settings['plane'] })}
        >
          <option value="aboveNarrative">Над текстом</option>
          <option value="belowNarrative">Под текстом</option>
        </select>
      </label>

      <label>
        Внутренний якорь текста
        <select
          value={settings.frameAnchor}
          onChange={(e) => onChange({ frameAnchor: e.target.value as Settings['frameAnchor'] })}
        >
          <option value="top-left">Слева сверху</option>
          <option value="center">Центр</option>
          <option value="bottom">Снизу</option>
        </select>
      </label>

      <label>
        Смещение рамочного текста, px
        <input
          type="range"
          min="-100"
          max="100"
          value={settings.offsetX}
          onChange={(e) => onChange({ offsetX: Number(e.target.value) })}
        />
      </label>

      <label className={styles.Check}>
        <input
          type="checkbox"
          checked={settings.mask}
          onChange={(e) => onChange({ mask: e.target.checked })}
        />
        Рамочная маска
      </label>

      <label className={styles.Check}>
        <input
          type="checkbox"
          checked={settings.customPlacement}
          onChange={(e) => onChange({ customPlacement: e.target.checked })}
        />
        Cross-region и прокрутка content
      </label>

      <label className={styles.Check}>
        <input
          type="checkbox"
          disabled={!settings.customPlacement}
          checked={settings.independentAnchor}
          onChange={(e) => onChange({ independentAnchor: e.target.checked })}
        />
        Независимый anchor в storyViewport
      </label>
    </fieldset>
  );
};
