# Финализация DOM-регионов и CSS-first эффектов

Ветка `experiment/story-regions-finalization`, база `experiment/css-first-story-surfaces` во всех трёх репозиториях. Предыдущие ветки и main не изменены; merge не выполнялся. Собранный core **0.0.52** установлен в editor; types — **0.0.3**. Это окончательное описание текущего контракта; отчёты предыдущих экспериментов сохранены как история.

## DOM и семантика

```text
BookApplicationSurface [application]
├─ underStory
├─ StoryRoot [story]
│  └─ StoryShell #story-shell
│     └─ StoryViewport #story-viewport
│        ├─ StoryViewportFrame [storyViewportFrame, absolute inset:0]
│        │  └─ VisualHost(storyViewportFrame)
│        ├─ NarrativeFrame [narrativeFrame, flex:1; min-height:0]
│        │  ├─ NarrativeViewport [narrativeViewport]
│        │  │  ├─ #narrative [настоящий scrollport с padding текста]
│        │  │  │  └─ NarrativeContent [narrativeContent]
│        │  │  │     ├─ .Text → keyed StoryContent → текущая страница
│        │  │  │     └─ VisualHost(narrativeContent)
│        │  │  └─ VisualHost(narrativeViewport)
│        │  └─ VisualHost(narrativeFrame)
│        ├─ ToolbarFrame [toolbarFrame, padding, естественная высота]
│        │  ├─ Toolbar #Toolbar [toolbar, flex-wrap]
│        │  │  ├─ кнопки
│        │  │  └─ VisualHost(toolbar)
│        │  └─ VisualHost(toolbarFrame)
│        ├─ VisualHost(storyViewport)
│        └─ существующие Menu / TOC / Bookmarks
│  + VisualHost(story)
├─ aboveStory / feedback / selection
└─ editorTools находятся за границами декоративного boundary
```

Каждый из девяти регионов — **прямоугольник**. `storyViewportFrame` совпадает с границами всего viewport, включая Toolbar. Это один абсолютный слой без участия в layout, а не вторая копия размеров. `narrativeFrame` ограничен нарративом; `toolbarFrame` включает padding панели; `toolbar` — собственно её содержимое. Старого `frame` и перенаправления на narrativeFrame нет.

У восьми локальных регионов по одному постоянному host; у application сохранены прежние underlay/overlay/feedback/selection. Нет комбинаций «каждый регион × каждый plane». Стандартное заполнение — CSS inset:0. `StoryRegionsProvider` по-прежнему отдельно хранит реальные элементы и portal-hosts; нового измерительного API нет.

## Независимые параметры

| Задача | Контракт |
| --- | --- |
| Прямоугольник | `placement.region` |
| Плоскость и порядок | `depth.plane`, `depth.order` |
| Рамочные стороны | необязательная `visibility.sides` |
| Толщина маски | необязательная `visibility.frameWidth: VisualLength | Record<FrameSide, VisualLength>` |
| Художественный clipping | `visibility.mask` circle/polygon |

Без sides любой регион, включая названия с Frame, заполняется полностью. Пустой sides скрывает всю поверхность. Маска использует native CSS gradients; frameWidth по умолчанию 12px, поддерживает px/% и четыре независимые толщины (`top`, `right`, `bottom`, `left`). Толщина маски не меняет padding текста или Toolbar. Сохранились прежние четыре plane; новых plane для Toolbar не добавлено.

```ts
placement: { region: 'toolbarFrame' },
visibility: {
  sides: ['top', 'right', 'bottom', 'left'],
  frameWidth: { value: 8, unit: 'px' },
},
depth: { plane: 'aboveNarrative', order: 2 },
```

Кнопки участвуют в прежнем ранге controls, а их родители не создают лишний stacking context. Поэтому эффект в toolbar может находиться под кнопками либо над ними. Эффект storyViewportFrame может закрывать нарратив и оставаться под Toolbar. Hosts/surfaces декоративны, pointer-events отключены; Toolbar остаётся интерактивным.

Встроенные Frame declarations по умолчанию выбирают storyViewportFrame. Их тени и текст используют точные 100% размера области; старый 101% overscan удалён, чтобы нижняя сторона не выходила за пределы viewport. Позиционирование, presets и offsets остаются CSS.

## Toolbar и layout

У внутреннего Toolbar нет фиксированной высоты или искусственного margin-top. ToolbarFrame задаёт вертикальный padding 12px и адаптивный горизонтальный padding. Высота определяется содержимым и переносом flex-items. NarrativeFrame занимает остаток высоты. Проверены изменение числа кнопок, мобильные 320/390px, отсутствие выхода панели за viewport и сохранение рабочей области текста.

Удалены `--story-toolbar-height`, `--story-toolbar-margin` и соответствующий регулятор лаборатории. Старые `--frame-top/right/bottom/left` разделены по обязанностям: `--narrative-*` используются только для отступов текста, `--visual-frame-width` — только для художественной маски. `--frame-shadow-color` остаётся локальным параметром цветных presets и к layout не относится.

## Types, builder и editor

VisualRegion и renderer regions содержат application, story, storyViewport, storyViewportFrame, narrativeFrame, narrativeViewport, narrativeContent, toolbar, toolbarFrame. У отсутствующего Toolbar handles равны null. Frame alias удалён без миграции или fallback.

Панель Background/Frame переиспользуется: девять областей, mask sides/width, anchor/origin, offsets, size, scale/rotate, plane/order. Выбор готовых storyViewportFrame/toolbarFrame в UI включает стороны как удобный preset; маску можно отдельно снять без изменения региона. Нарратив с рамочной маской выражается сочетанием narrativeFrame + sides, без нового значения enum.

Временный VisualLayout draft содержит placement/depth/visibility. Удалены скрытые FrameOptions.layer/frameMask и вывод маски из имени региона. Builder валидирует новые регионы и неотрицательную конечную толщину; старый frame отвергается. Custom JSON и внутренние CSS-слои пользовательского renderer остаются свободными.

Новые эффекты получают canonical depth сразу, без style.zIndex. Core hooks используют явный order для глубины; изменения style.zIndex не меняют порядок поверхности. FrameRenderer, BackgroundRenderer и FrameElement больше не используют старый zIndex для глобального ранга. Внутренние z-index кастомного artwork допустимы внутри его surface.

Глобальные HTML id вида effect-… удалены из встроенных wrappers после проверки потребителей; data-effect-id сохранён. Функциональные story/Toolbar/media IDs не удалялись.

Проверены создание, редактирование, дублирование с независимыми масками, Ctrl+S при фокусе в числе, сохранение/переоткрытие, импорт реального проекта, preview, экспорт и запуск построенного reader. Реальный TGZ получает все девять настоящих DOM handles. Сквозной тест экспортирует toolbarFrame с маской 8px и проверяет её host, размеры и native maskImage в собранной книге.

## Демонстрации

`npm run dev:visual-lab`; `/tests/visualPlayground/?mode=reader` или `?mode=editor`.

- **Наступающая тьма:** одна регистрация/controller/run. По умолчанию outside → общая storyViewportFrame → ToolbarFrame вместе с padding → NarrativeViewport. Финальный application veil закрывает outline/shadow viewport, оставляя feedback выше. Альтернативная композиция меняет вторую фазу на NarrativeFrame, сохраняя отдельное затемнение панели. Без Toolbar его фаза пропускается, общий duration сохраняется, controls-covered отмечается вместе с завершением frame-фазы, чтобы ожидающие milestone не зависали. Изменение наличия Toolbar в этом demo явно останавливает текущую композицию.
- **Сквозной свет:** «Рамка всего вьюпорта» использует новый rectangle + native side mask и включает Toolbar. Нарратив выбирается отдельно. Центр волны может адресно измерять источник и target.
- **Рамка и текст:** viewport, нарратив, ToolbarFrame; независимые plane, presets pulse/police/caramel, anchors/offsets. Browser проверяет CSS-анимацию текста и точные размеры обеих FrameElement.
- **11 · Toolbar и его рамка:** два независимых экземпляра — свечение toolbarFrame и полосы в toolbar. Смена слоя содержимого показывает разницу под/над кнопками, сохраняя renderer identity и клики.
- Прочие сцены и эталонный шарик сохранены.

[Общая рамка](story-regions-finalization/01-whole-viewport-frame.png), [раздельная композиция](story-regions-finalization/02-split-narrative-frame.png), [Toolbar](story-regions-finalization/03-toolbar-and-frame.png), [Through](story-regions-finalization/04-through-viewport-frame.png), [мобильный layout](story-regions-finalization/05-mobile-toolbar.png).

## Анимации

| Реализация | Решение |
| --- | --- |
| Collapse | SCSS scale keyframes на настоящем viewport, fill:none |
| SingleScene: сжатие | SCSS scale keyframes, исходный transform не переписывается |
| AdvancingDarkness | именованные SCSS opacity keyframes с задержками фаз |
| Smoke: появление/затухание | SCSS opacity envelope; частицы уже использовали CSS |
| Through: распространение | SCSS transform/opacity; размеры и центр задаются отдельно |
| Edges | SCSS-анимация зарегистрированного CSS percentage; измерения отключены |
| Frame pulse/scroll, Toolbar glow | декларативный CSS |
| Darkness grow/shrink/reveal, SingleScene shade | WAAPI: динамические circle/hole keyframes зависят от адресной геометрии и обновляются без сброса фазы |
| ContinuousBall | сохранён исходный WAAPI-пример как независимый эталон непрерывности |
| Служебные finite clocks | прежний WAAPI clock без visual keyframes и без React progress |

Demo-local startCssAnimation выбирает CSSAnimation по конкретному animationName, не случайный первый объект. Управление и session.runs остаются прежними. Cleanup снимает только принадлежащий demo класс/переменные; getAnimations после снятия класса применяет CSS-изменение перед синхронным повторным запуском. Это style reconciliation на stop/replay, не измерение координат и не работа на каждом кадре. Новый регрессионный тест проверяет завершённый второй run того же CSS renderer.

Pause/resume, stop, loop, late milestones, started/completed/cancelled и cleanup сохранены. Исходный inline transform rotate(3deg) и layout sizes переживают Collapse; снятие CSS-анимации возвращает исходный CSS. Нет animation-state snapshots, восстановителей или нового animation engine.

## Loader и непрерывность

StoryViewport больше не скрывает постоянных детей через display:none. Spinner сохраняет прежнюю логику readiness/антифликера; только keyed StoryContent получает aria-busy/inert и visibility:hidden до готовности страницы. Регионы и range renderers остаются в layout.

В reader и editor тест задерживает настоящий HTTP-ответ изображения. Пока loader активен и после ответа сравниваются тот же DOM-узел, тот же CSSAnimation, растущий currentTime, тот же canvas/context и нарисованный пиксель. Новый контент скрыт до готовности и появляется после неё.

Шарик на 1 → 2 → 4 сохраняет DOM, Animation и phase. Проверяются StoryRoot, StoryShell, NarrativeContent, остальные регионы и все восемь hosts. Page-only шарик освобождается, выход на страницу 3 отменяет range Animation, повторный вход создаёт новую активацию. Loader не превращён в повод remount.

## Отдельный рефакторинг

JSON fingerprint/parse списка page IDs в AppContent заменён простым сравнением массива с предыдущими IDs через ref. Dispatch выполняется только при изменении значений; ID validation сохранена. Обычные данные клонируются structuredClone; JSON copy оставлен только на границе преобразования options в допустимый сериализуемый JSON.

StoryRegionsProvider оставлен простым разделением элементов и hosts. VisualSurface не получил контроллеров геометрии. В затронутых файлах убраны лишние пустые строки/импорты/комментарии. LayoutSettings и FrameSideCheckboxes редактора вынесены в собственные директории без изменения поведения. Косметика отделена от функциональных изменений.

## Проверки и пределы готовности

- Types: typecheck, compile tests, bundler tests.
- Core: source/fixture TypeScript, 40 Jest, 8 SCSS-alias, 60 browser tests; дополнительные целевые прогоны CSS replay/optional Toolbar и masks.
- Editor: TypeScript всех workspaces/tests, 61 unit, 4 component, 14 browser, production build.
- Production runtime: edit/save/reopen/reorder/add/delete → build → reader с настоящим TGZ и новой Toolbar-маской.
- ESLint/Stylelint затронутого кода: ошибок нет. Старые hook-dependency/max-lines warnings и предупреждение Vite о крупных chunks не скрывались.
- Linux screenshots визуально проверены и обновлены из-за естественной высоты Toolbar и правильной рамки всего viewport, а не ослабления проверок. Windows reference не переснимался и требует обновления/проверки на Windows после этих layout-изменений.
- Core TGZ имеет новую версию, не подменяет старый архив. Проверено совпадение JS собранных и установленных Toolbar/AppContent.

Адресные JS-измерения остались только у editor selection и художественного cross-region origin (resize, не кадры). Обычные fills/anchors/masks их не используют. CSS-first архитектура не усложнена вторым layout: добавлены три реальные области, один параметр толщины и небольшой private CSS playback helper. Это существенно меньше удалённого ранее универсального геометрического конвейера.

Результат готов для финального архитектурного ревью. Для интеграции в main нужно принять всю зависимую цепочку экспериментов, проверить Windows reference и выполнить ручной прогон iOS/Android (audio unlock, жесты, vibration/flashlight). Автотесты Chromium не доказывают работу аппаратных возможностей. Video core #30, lazy TGZ editor #53, branching, prefetch, новый history API и physical layout engine сознательно не менялись. Слияния не выполнены.

## Карта коммитов для ревью

Порядок сохраняет отдельные diff для механики, DOM, поведения и косметики:

| Core | Область ревью |
| --- | --- |
| `a1cdfd6` | Только переименование переменных padding текста, без DOM/поведения |
| `1a42716` | Новые DOM-регионы, естественная Toolbar, независимая маска и проверки геометрии |
| `5d09fd7` | Loader и HTTP-регрессия непрерывности CSS/Canvas |
| `6adb5d6` | Удаление HTML id эффектов и дублирующего глобального zIndex |
| `10d8b26` | Регистрация browser-проверок регионов и loader в общем suite |
| `bb1b693`, `73285a5` | Перенос статических keyframes в SCSS |
| `238674f` | Исправление композиций и новая демонстрация Toolbar |
| `cfced67` | AppContent и отдельный рефакторинг затронутого кода |
| `13bc4a1`, `5dcaf82` | Версии пакета; финальный 0.0.52 устраняет 101% overscan |
| `7b2c881` | Проверенные screenshot/loader expectations |
| `1175265`, `b3525e1` | Регрессии CSS replay и отсутствующего Toolbar |
| `fa33e08` | Только релевантные controls составных демонстраций |

Editor: `4b1312a` — builder и контракт сериализации; `61029f3` — controls и сквозные проверки; `4cda779` — проверенный Linux screenshot; `8d3bf5b` — выделение компонентов и косметика; `aa7eb60` — установка финального core 0.0.52. Types: `6e67837` — контракт с compile-проверками; `b89bddb` — его документация. Финальные отчёты и иллюстрации добавлены отдельными docs-коммитами.
