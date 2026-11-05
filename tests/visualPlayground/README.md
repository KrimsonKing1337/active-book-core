# Visual Playground — CSS-first эксперимент

Запуск из корня ядра: `npm run dev:visual-lab`. Reader: `/tests/visualPlayground/?mode=reader`; editor: `?mode=editor`.

[Финальная архитектура, проверки и замеры](../../docs/css-first-story-surfaces.ru.md). Старые отчёты описывают предыдущие эксперименты.

`Controls → Playground.change → registrationsFor/definitionsFor → AppWrapper/session → StoryRoot → VisualSurfaces → RegisteredVisualEffect`.

Обычная поверхность заполняет настоящий выбранный DOM-регион через `inset: 0`. Общего geometry snapshot, CSS/JS переключателя, layout lease и React progress на каждом кадре нет.

- `Controls`, `FrameControls` — десять демонстраций, общие параметры, художественный frameAnchor.
- `registrations.ts` — definitions и авторские регистрации с region/layer/lifetime.
- `hooks/useAnimationPlayback` — native WAAPI clocks, pause/resume/stop и семантические события в `session.runs`.
- `hooks/useRelativeOrigin` — адресное измерение двух элементов для художественного cross-region origin, без измерений на кадре.
- `sequence.ts` — координация по run/milestone с отменой.
- `Collapse`, `SingleScene` — visual transform настоящего viewport; исходный CSS восстанавливается снятием native animation.
- `ContinuousBall` — собственный DOM/WAAPI в стабильном narrativeFrame; range identity проверяется на 1 → 2 → 4, выход — страница 3.
- `AdvancingDarkness` — одна регистрация, четыре native фазы: outside → frame → Toolbar → narrative; финальный veil закрывает декор viewport, сохраняя feedback.

`params.opacity` — диагностическая непрозрачность, панель показывает обратную прозрачность в процентах. Это параметр лаборатории, не новый обязательный production-контракт.

Смена параметров, размера, слоя, текущей активной страницы диапазона сохраняет renderer в том же регионе. Явная смена региона переносит portal в другой DOM-parent и может перемонтировать renderer. Выход из lifetime уничтожает его ресурсы.

Проверки: `npm run typecheck`, `npm run typecheck:test`, `npm run test:browser`. Снимки прогонов — ignored `artifacts/`; обзор четырёх фаз — [docs/css-first](../../docs/css-first/).
