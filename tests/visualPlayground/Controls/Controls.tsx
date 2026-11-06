import type { Settings } from '../@types';

import { FrameControls } from '../FrameControls';

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
  ['ball', '09 · Непрерывный шарик'],
  ['toolbar', '11 · Toolbar и его рамка'],
  ['advancing', '10 · Наступающая тьма'],
];

export const Controls = ({
  settings,
  onChange,
  onPlay,
  onPause,
  onResume,
  onStop,
}: ControlsProps) => {
  const isBall = settings.demo === 'ball';
  const isPhysical = ['collapse', 'sequence', 'single'].includes(settings.demo);
  const durationLabel = isPhysical && settings.demo !== 'single' ? 'Длительность этапа, мс' : 'Длительность, мс';
  const sliders: readonly [keyof Settings, string, number, number, number][] = [
    ['duration', durationLabel, 300, 10000, 100],
    ['intensity', 'Интенсивность', 0.1, 1, 0.05],
    ['speed', 'Скорость дыма', 0.3, 3, 0.1],
    ['originX', 'Точка возникновения X, %', 0, 100, 1],
    ['originY', 'Точка возникновения Y, %', 0, 100, 1],
    ['width', 'Ширина приложения, px', 320, 1400, 10],
    ['height', 'Высота приложения, px', 360, 900, 10],
    ['storySize', 'Размер StoryRoot, %', 45, 100, 1],
  ];
  const visibleSliders = sliders.filter(([name]) => {
    if (isBall) {
      return ['width', 'height', 'storySize'].includes(name);
    }

    if (name === 'originX' || name === 'originY') {
      return settings.demo === 'darkness';
    }

    if (name === 'speed') {
      return settings.demo === 'smoke';
    }

    return name !== 'intensity' || !isPhysical;
  });

  return (
    <aside className={styles.Controls} data-editor-tools>
      <div className={styles.Title}>
        <span>
          КОЛЛЕКЦИЯ ЭФФЕКТОВ
        </span>

        <small>
          10 экспериментов
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

      {settings.demo === 'ball' ? (
        <p>Автоматический диапазон: 1 → 2 → 4 сохраняет шарик; 3 выключает его, 1 создаёт новый.</p>
      ) : (
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
      )}

      {!isBall && (
        <>
          <label className={styles.Check}>
            <input
              type="checkbox"
              checked={settings.loop}
              onChange={(e) => onChange({ loop: e.target.checked })}
            />
            Зациклить
          </label>

          <label>
            Область действия
            <select
              value={isPhysical || settings.demo === 'edges' ? 'application' : settings.region}
              disabled={isPhysical || settings.demo === 'edges'}
              onChange={(e) => onChange({ region: e.target.value as Settings['region'] })}
            >
              <option value="storyViewport">Весь вьюпорт</option>
              <option value="narrativeFrame">Только нарратив</option>
              <option value="toolbar">Toolbar</option>
              <option value="toolbarFrame">Рамка Toolbar</option>
              <option value="storyViewportFrame">Рамка всего вьюпорта</option>
              <option value="narrativeViewport">Неподвижный overlay нарратива</option>
              <option value="narrativeContent">Прокручиваемое содержимое</option>
              <option value="story">Весь StoryRoot</option>
              <option value="application">Приложение за границами story</option>
            </select>
          </label>

          {settings.demo === 'darkness' && (
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
          )}

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

        </>
      )}

      {(settings.demo === 'frame' || settings.demo === 'toolbar') && (
        <FrameControls settings={settings} onChange={onChange} />
      )}

      {settings.demo === 'advancing' && (
        <label>
          Композиция тьмы
          <select
            value={settings.composition}
            onChange={(event) => onChange({ composition: event.target.value as Settings['composition'] })}
          >
            <option value="single">
              Общая рамка вьюпорта → внутри произведения
            </option>

            <option value="multiple">
              Рамка нарратива и Toolbar раздельно
            </option>
          </select>
        </label>
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

      <fieldset>
        <legend>
          Параметры и рабочая поверхность
        </legend>

        {!isBall && (
          <label>
            <span>
              Прозрачность эффекта: {Math.round((1 - settings.opacity) * 100)}%
            </span>

            <input
              type="range"
              aria-label="Прозрачность эффекта"
              min={0}
              max={100}
              step={5}
              value={Math.round((1 - settings.opacity) * 100)}
              onChange={(e) => onChange({ opacity: 1 - Number(e.target.value) / 100 })}
            />
          </label>

        )}

        {visibleSliders.map(([name, label, min, max, step]) => {
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
