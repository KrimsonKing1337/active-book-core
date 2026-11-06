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
        Размещение рамки
      </legend>

      <label>
        Пресет тени
        <select
          value={settings.framePreset}
          onChange={(event) => onChange({ framePreset: event.target.value as Settings['framePreset'] })}
        >
          <option value="pulse">Пульсация</option>
          <option value="police">Police</option>
          <option value="caramel">Caramel</option>
        </select>
      </label>

      <label>
        Плоскость рамки
        <select
          value={settings.plane}
          onChange={(e) => onChange({ plane: e.target.value as Settings['plane'] })}
        >
          <option value="aboveStoryControls">Над кнопками</option>
          <option value="background">Фон</option>
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
          <option value="top">Сверху</option>
          <option value="top-right">Справа сверху</option>
          <option value="left">Слева</option>
          <option value="center">Центр</option>
          <option value="right">Справа</option>
          <option value="bottom-left">Слева снизу</option>
          <option value="bottom-right">Справа снизу</option>
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

    </fieldset>
  );
};
