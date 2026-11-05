# Visual Playground — карта кода

Это **экспериментальная browser fixture**, а не production-редактор эффектов. Запуск из корня ядра: `npm run dev:visual-lab`. Подробные сценарии и ограничения описаны в [docs/visual-playground.md](../../docs/visual-playground.md).

## От панели до изображения

```text
.Controls → Playground.change(settings)
          ↓
registrationsFor(settings) → authored registrations
definitionsFor(settings)   → React renderers + экспериментальные host/layout metadata
          ↓
AppWrapper → одна VisualEffects session → StoryRoot
          ↓
VisualSurfaces → VisualSurface → RegisteredVisualEffect
          ↓
Darkness / Smoke / FrameDemo / Through / Collapse / SingleScene
```

- `Controls/Controls.tsx` — выбор демонстрации, воспроизведение и общие настройки.
- `FrameControls/FrameControls.tsx` — только сравнение CSS/JS и настройки рамки.
- `Playground/Playground.tsx` — состояние панели, команды playback, подключение сессии и визуальная рабочая область.
- `registrations.ts` — раздельно создаёт **definitions** (какой React renderer использовать) и **registrations** (какой экземпляр/регион/параметры запустить). Отдельные функции формируют рамку и составную сцену.
- `hooks/useTimeline.ts` — один animation clock для простых демонстрационных renderers; передаёт события milestone/completed в `session.runs`. Запуск происходит по команде, а не при монтировании.
- `sequence.ts` — последовательный запуск независимых эффектов с ожиданием конкретных run/milestone.
- `Collapse` и `SingleScene` — физическое воздействие через `BookApplicationSurface.layout.acquire()`, не через произвольные DOM-селекторы.

## Как проверить прозрачность

`Settings.opacity` хранит **непрозрачность** (0–1). Панель показывает обратную величину — прозрачность в процентах. Значение передаётся в `registration.effect.params.opacity`.

Демонстрационные renderers применяют его к итоговой видимости: например, `Darkness` умножает `opacity` на `intensity`, а `SingleScene` — на собственное анимационное затухание. Поэтому даже составное затемнение с `intensity: 1` можно сделать полупрозрачным для наблюдения границ областей.

**Важно:** `opacity` — исключительно отладочный параметр этой лаборатории, он не вводит новый контракт production-эффектов. При 0% прозрачности сохраняется прежний внешний вид.

## Где находится геометрия

- `src/components/VisualSurfaces/utils/placement.ts` — преобразование якорей и смещений.
- `src/components/VisualSurfaces/utils/cssLayout.ts` — ограниченный критерий, когда допустим CSS-layout вместо JS.
- `src/components/VisualSurfaces/components/VisualSurface` — визуальный wrapper и выбор пути CSS/JS.
- `src/components/BookApplicationSurface` — внешние under/above-слои и ограниченный layout host.
- `src/controllers/visualEffects/runs.ts` — состояние запусков и контрольные точки.
- `src/controllers/visualEffects/layout.ts` — владение физическим изменением размеров/scale.

При обычном редактировании параметров не меняй `definitionId`, `plane` или host без необходимости: это может влиять на идентичность React-поддерева. Переходы между активными страницами диапазона должны сохранять renderer.

## Проверки

Браузерные сценарии находятся в `scripts/visualPlayground.browser.test.js`. Они проверяют сравнение CSS/JS, области видимости, маски, диапазоны, внешние слои, физические эффекты, события, отмену и очистку. Отдельный сценарий проверяет, что изменение диагностической прозрачности не перемонтирует тьму.

```sh
npm run typecheck
npm run typecheck:test
npm run test:visual-lab
```

Наличие контрольных браузерных тестов не означает поддержки всех произвольных CSS-anchor или производственных сцен: это границы экспериментального прототипа.
