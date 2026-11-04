import type { Settings } from '../@types';

import * as styles from './Controls.module.scss';

type ControlsProps = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

const demos: readonly [Settings['demo'], string][] = [
  ['frame', '01 · Рамка и текст'],
  ['darkness', '02 · Тьма из центра'],
  ['edges', '03 · Тьма с краёв'],
  ['smoke', '04 · Дым'],
  ['through', '05 · Сквозной свет'],
  ['collapse', '06 · Сжатие'],
  ['sequence', '07 · Последовательность'],
  ['single', '08 · Одна сцена'],
];

export const Controls = ({
  settings,
  onChange,
  onPlay,
  onPause,
  onResume,
  onStop,
}: ControlsProps) => {
  const isFrame = settings.demo === 'frame';
  const isPhysical = ['collapse', 'sequence', 'single'].includes(settings.demo);
  const sliders: readonly [keyof Settings, string, number, number, number][] = [
    ['duration', 'Длительность, мс', 300, 10000, 100],
    ['intensity', 'Интенсивность', 0.1, 1, 0.05],
    ['originX', 'Точка возникновения X, %', 0, 100, 1],
    ['originY', 'Точка возникновения Y, %', 0, 100, 1],
    ['width', 'Ширина приложения, px', 320, 1400, 10],
    ['height', 'Высота приложения, px', 360, 900, 10],
    ['storySize', 'Размер StoryVisualRoot, %', 45, 100, 1],
    ['toolbarHeight', 'Высота Toolbar, px', 32, 110, 1],
  ];

  return (
    <aside className={styles.Controls} data-editor-tools>
      <div className={styles.Title}>
        <span>
          КОЛЛЕКЦИЯ ЭФФЕКТОВ
        </span>

        <small>
          8 экспериментов
        </small>
      </div>

      <div className={styles.Demos}>
        {demos.map(([value, title]) => {
          return (
            <button
              key={value}
              type="button"
              aria-pressed={settings.demo === value}
              onClick={() => onChange({ demo: value })}
            >
              {title}
            </button>
          );
        })}
      </div>

      <div className={styles.Transport}>
        <button type="button" data-testid="play" onClick={onPlay}>
          ▶ Воспроизвести
        </button>

        <button type="button" onClick={onPause}>
          Пауза
        </button>

        <button type="button" onClick={onResume}>
          Продолжить
        </button>

        <button type="button" onClick={onStop}>
          Стоп / сброс
        </button>
      </div>

      <label>
        Область действия
        <select
          value={settings.region}
          onChange={(e) => onChange({ region: e.target.value as Settings['region'] })}
        >
          <option value="storyViewport">Вьюпорт с Toolbar</option>
          <option value="narrativeFrame">Нарратив и рамка</option>
          <option value="story">Весь StoryVisualRoot</option>
          <option value="application">Приложение за границами story</option>
        </select>
      </label>

      <label>
        Направление
        <select
          value={settings.direction}
          onChange={(e) => onChange({ direction: e.target.value as Settings['direction'] })}
        >
          <option value="grow">Из центра к краям</option>
          <option value="shrink">Сужение в центр</option>
          <option value="reveal">Исчезновение из центра</option>
        </select>
      </label>

      <label>
        Способ запуска
        <select
          value={settings.trigger}
          onChange={(e) => onChange({ trigger: e.target.value as Settings['trigger'] })}
        >
          <option value="manual">Кнопкой</option>
          <option value="page">При переходе страницы</option>
        </select>
      </label>

      <label className={styles.Color}>
        Цвет
        <input
          type="color"
          value={settings.color}
          onChange={(e) => onChange({ color: e.target.value })}
        />
      </label>

      {isFrame && (
        <fieldset>
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
        </fieldset>
      )}

      {settings.demo === 'through' && (
        <label>
          Композиция
          <select
            value={settings.composition}
            onChange={(e) => onChange({ composition: e.target.value as Settings['composition'] })}
          >
            <option value="single">Один непрерывный renderer</option>
            <option value="multiple">Три отдельных эффекта</option>
          </select>
        </label>
      )}

      {isPhysical && (
        <label>
          Способ сжатия
          <select
            value={settings.physicalMode}
            onChange={(e) => onChange({ physicalMode: e.target.value as Settings['physicalMode'] })}
          >
            <option value="scale">Визуальный transform: scale</option>
            <option value="size">Реальные width / height</option>
          </select>
        </label>
      )}

      <fieldset>
        <legend>
          Параметры и рабочая поверхность
        </legend>

        {sliders.map(([name, label, min, max, step]) => {
          return (
            <label key={name}>
              <span>
                {label}: {String(settings[name])}
              </span>

              <input
                type="range"
                aria-label={label}
                min={min}
                max={max}
                step={step}
                value={Number(settings[name])}
                onChange={(e) => onChange({ [name]: Number(e.target.value) })}
              />
            </label>
          );
        })}

        <label className={styles.Check}>
          <input
            type="checkbox"
            checked={settings.toolbar}
            onChange={(e) => onChange({ toolbar: e.target.checked })}
          />
          Показать Toolbar
        </label>
      </fieldset>
    </aside>
  );
};
