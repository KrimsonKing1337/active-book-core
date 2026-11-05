# CSS-first эффекты на постоянных DOM-регионах

Экспериментальная ветка `experiment/css-first-story-surfaces`, база — `experiment/persistent-story-viewport`. Старые эксперименты не изменены и не слиты. Отчёт описывает финальную реализацию, а не промежуточный CSS/JS переключатель.

## Как читать коммиты

| Коммит ядра | Независимый предмет ревью |
| --- | --- |
| `e6134cc` | Только согласованные переименования, селекторы и версия пакета |
| `226fb5b` | Постоянные реальные регионы и локальные DOM-хосты |
| `dc3df14` | CSS-размещение встроенных поверхностей |
| `82a9158` | Application в reader и адресное редакторское выделение |
| `88d78e4` | Native playback вместо React-progress для Frame/Smoke |
| `8ed1390` | Остальные сцены и новая «Наступающая тьма» |
| `ab83cdc` | Отдельное удаление общей геометрии и физического layout API |
| `c55080c` | Минимальная публичная CSS-модель и общий порядок слоёв |
| `502fc15` | Финальное затемнение декора viewport и защита feedback |

В editor отдельно идут переименования (`c9112f6`), сериализация/валидация builder (`484e1fe`) и общая панель размещения (`2f829f4`). Отдельный фикс `ec57d98` сохраняет присущую региону frame маску при выборе после unmasked draft. В types отдельно заменена геометрия на DOM handles (`5763fe9`) и упрощено размещение (`84c3d79`). Документация и воспроизводимые замеры идут последним коммитом. Коммиты не объединены.

## Реальная DOM-структура

```text
AppWrapper
├─ BookApplicationSurface [application, один boundary]
│  ├─ underStory                         (за непрозрачным viewport)
│  ├─ StoryRoot [story]
│  │  ├─ StoryShell #story-shell          (стабилен при смене pageId)
│  │  │  └─ StoryViewport #story-viewport
│  │  │     ├─ NarrativeFrame             [narrativeFrame / frame]
│  │  │     │  ├─ NarrativeViewport       [narrativeViewport]
│  │  │     │  │  ├─ #narrative           (реальный scrollport)
│  │  │     │  │  │  └─ .Narrative__Text  [narrativeContent]
│  │  │     │  │  │     ├─ .Text → keyed StoryContent → page content
│  │  │     │  │  │     └─ visual host
│  │  │     │  │  └─ visual host
│  │  │     │  └─ visual host
│  │  │     ├─ Toolbar
│  │  │     ├─ visual host
│  │  │     └─ Menu / TOC / Bookmarks
│  │  └─ visual host
│  ├─ aboveStory                         (display: contents)
│  ├─ feedback                           (display: contents)
│  └─ selection                          (защищённое редакторское выделение)
└─ editorTools                           (за границами декоративного boundary)
```

Пять локальных хостов — по одному на реальный регион. `frame` — стороны существующего `narrativeFrame`, а не шестая копия layout. `display: contents` у хостов не создаёт искусственную геометрию или отдельный stacking context. Нет декартова произведения «все регионы × все слои».

Внешний `BookApplicationSurface` переиспользуется через context. Если его нет, `AppWrapper` создаёт boundary только вокруг области чтения. `container-type: inline-size` поддерживает авто-высоту встраиваемого редактора. `FrameText` уже имеет собственный size-container. Application изолирует сцену от инструментов, а внутренний `StoryRoot` в этом boundary не создаёт дополнительный stacking context.

Переименованы `PageWrapper → StoryShell`, `PageContent → StoryContent`, `StoryVisualRoot → StoryRoot`, CSS-класс/id `MainContent/main-content → StoryViewport/story-viewport`. Семантика `pageId`, Page0 и модели страниц редактора сохранена. React Router не возвращён.

## Обычный эффект

```ts
const registration = {
  effect: {
    id: 'mist',
    definitionId: 'custom.background/my-library/Mist',
    params: {},
    placement: { region: 'narrativeViewport' },
    depth: { plane: 'aboveNarrative' },
  },
  lifetime: { type: 'range', range: [{ from: 1, to: 4 }] },
};
```

Это заполнение CSS `position: absolute; inset: 0` внутри выбранного DOM-региона. `anchor`, `origin`, `offset`, `size`, `scale`, `rotate` необязательны. Все девять точек реализованы процентами, `calc`, `translate`, `transform-origin`, `scale`, `rotate`. Проценты смещения относятся к контейнеру, процент translate — к самой поверхности. `origin` по умолчанию совпадает с `anchor`.

Это **якорь поверхности**, а не художественный центр её рисунка. Например, FrameDemo использует собственный `frameAnchor`, а Darkness/Through могут выбирать отдельный origin внутри рисунка.

`placement.region` — единственный источник области. Отдельных `coordinates`, `anchor.region`, `visibility.region`, `displayRegion` больше нет. `visibility` содержит только необязательные `sides`/`mask`; circle/polygon передаются в native CSS `clip-path`. Радиус `%` у circle имеет обычную CSS-семантику, не прежнюю формулу через меньшую сторону. Runtime-миграция старого экспериментального JSON не добавлена: фикстуры и builder обновлены на новый контракт.

Слои: `background`, `belowNarrative`, `aboveNarrative`, `aboveStoryControls`. В одном слое порядок задаёт `depth.order` (по умолчанию 0), при равенстве — id. Ранг поверхности отделён от рангов текста, Toolbar, feedback и окон читателя с помощью шага `число поверхностей + 1`, а не произвольных авторских z-index. Меню и Modal используют зарезервированный диапазон. Внешний background лежит под viewport; остальные application-слои участвуют в общем порядке сцены. Для доверенных host definitions остаётся метаданные `systemFeedback`; автор не может выбрать этот защищённый слой через JSON.

В editor Background и Frame используют одну панель: семь регионов, четыре слоя, девять якорей, origin, px/% offsets и размеры, scale/rotate, порядок и сброс «Заполнить область». Числа сохраняются при валидном `onChange`, в том числе по Ctrl+S до blur. Параметры library effect не превращены в отдельный универсальный редактор; они остаются непрозрачным JSON.

## Custom renderer и адресные исключения

`VisualRendererProps.regions` передаёт разрешённые реальные HTMLElement/null: application, story, storyViewport, narrativeFrame, frame, narrativeViewport, narrativeContent. `frame` ссылается на narrativeFrame. Native TGZ-компонент получает те же handles; это проверено через реальный пакет, не только типами. Canvas/WebGL может владеть своим DOM и локальным ResizeObserver. Общего снимка геометрии и API восстановления состояния нет.

JS-измерения сохранены только там, где они нужны:

1. `VisualSelectionOutline`: выбранный регион + positioning boundary; для прокручиваемого content дополнительно clip viewport. Один scoped ResizeObserver, scroll/resize объединяются через rAF. Без выделения измерений нет.
2. Demo `useRelativeOrigin`: два конкретных элемента для художественного origin Darkness/Through/SingleScene. Scoped ResizeObserver обновляет keyframes при resize; измерений на каждом кадре нет.
3. Test-only Canvas-подобный CounterRenderer может измерять собственную поверхность. Это возможность custom renderer, не инфраструктура player.

`readRegions` в browser tests читает DOM как независимый эталон ожидаемых размеров. Его нет в production bundle.

## Что удалено

- `StoryRoot/geometry/`: `getStoryGeometry`, `useStoryGeometry`, `regionCorners`, общие geometry types/exports и их старые unit-тесты.
- `BookApplicationSurface/geometry.ts`: `geometryInApplication` и преобразования общего снимка.
- `RegisteredVisualEffect/geometryContext.ts`: `VisualRegionGeometryContext`.
- `VisualSurfaces/utils/placement.ts`, `resolveVisualSurface.ts`, `cssLayout.ts`, `masks.ts` и соответствующие unit-тесты: JS-placement, геометрические маски/углы, `supportsCssLayout`, fallback-путь.
- CSS-зеркало размеров и универсальные surface/region rect snapshots.
- `controllers/visualEffects/layout.ts` и `layout.test.ts`: `LayoutLease`, `createViewportLayoutHost`, physical resize/scale API и события.
- Специальный `StoryShell/NarrativeFrameContext.ts`: шарик получает общий настоящий region handle.
- `tests/visualPlayground/hooks/useTimeline.ts`: React state на каждом кадре.
- В editor: `displayRegion.ts`, дублирующая панель StyleEditor/LayerSettings и её style-zIndex helper/tests.

Временные `LocalVisualSurface(s)` перенесены в конечный `VisualSurface(s)`, а не оставлены вторым способом размещения. Старые browser-проверки сохранены и переписаны на native DOM, clipping, paint, lifecycle и selection. Удалены unit-тесты формул, которых больше нет.

## Демонстрации и непрерывность

Запуск: `npm run dev:visual-lab`; URL `/tests/visualPlayground/?mode=reader` либо `?mode=editor`. Доступны Frame, Darkness, Edges, Smoke, Through (одна/несколько частей), Collapse, Sequence, SingleScene, ContinuousBall, AdvancingDarkness. В панели есть play, pause, resume, stop, loop и диагностическая прозрачность.

«Наступающая тьма» — **одна авторская регистрация**, один controller/run:

1. Application underlay темнеет; настоящий viewport естественно закрывает его.
2. Темнеют стороны narrativeFrame с native CSS mask.
3. Темнеет реальный Toolbar.
4. Темнеет narrativeViewport. При завершении один статический application veil закрывает также outline/shadow viewport. Он удаляется при reset/unmount; feedback остаётся выше.

Это несколько portals одного renderer, не четыре эффекта, склеенные редактором. Нативные Animation остаются теми же при pause/resume и переходах 1 → 2 → 4. Снимки четырёх фаз — [css-first](css-first/).

У Collapse и SingleScene физическое изменение ширины/высоты заменено native WAAPI transform. `fill: none` снимает transform после завершения; cancel на stop/range-exit/destroy раскрывает исходный CSS. Специально проверено исходное `transform: rotate(3deg)`: inline style и layout dimensions не переписываются даже при визуальном размере 0.

`persistentStory.browser.test.js` в обоих режимах сравнивает **ссылки**, а не только одинаковую картинку: viewport, narrativeViewport, scrollport, frame, Toolbar, пять host nodes, шарик, его local parent и объект Animation. На 1 → 2 → 4 сохраняются узлы и Animation, `currentTime` продолжает расти; page-only шарик удаляется и отменяется. На странице 3 range-шарик исчезает, Animation становится idle/currentTime null. При повторном входе создаётся новый экземпляр. Закрытие книги также отменяет ресурс. Шарик не переводился на универсальную систему восстановления состояния.

`session.runs` сохранён: уже достигнутые milestones доступны поздним подписчикам, ожидания не теряются. Новые demo clocks — WAAPI, React обновляется только на семантических переходах. Animation.finished отменяется/игнорируется при устаревшем run; отмена не становится completed.

## Проверки

- Types: `typecheck`, compile tests, bundler tests — проходят.
- Core: source/fixture TypeScript, 39 Jest tests, 8 SCSS-alias tests; browser suite 51 tests (reader/editor, media, masks, clipping, layers, Toolbar/windows/history, selection, range identity, native phases, cleanup).
- Editor: typecheck всех workspaces и tests, 61 unit tests, 4 component tests, 13 browser tests. Старые screenshot goldens композиции не обновлены.
- Production runtime test: редактирование/сохранение/переоткрытие, reorder/add/delete, реальный TGZ, сборка и запуск reader — проходит. `build:editor` — проходит.
- Изменённый TS/SCSS проверен ESLint/Stylelint: ошибок нет; остаются предупреждения max-lines. Build сообщает о крупных chunks; code splitting в эту задачу не включён.
- Установлен **собранный core 0.0.50** с peer `@active-book/types ^0.0.2`; editor использует именно его TGZ. SHA256 собранного и установленного `VisualSurfaces.js` совпадает. В пакете нет старых geometry/layout модулей.
- Видео и изображения проверяются на активацию только в активных page/range lifetime. Уже известные проблемы video #30 и eager TGZ #53 не исправлялись.

Chromium-проверки не заменяют ручную проверку iOS/Android, аппаратного вибро/фонарика и всех мобильных жестов.

## Замеры и оценка сложности

[Сырые счётчики](css-first/measurements.json), инструмент — `scripts/measureCssFirst.js`:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium \
  node scripts/measureCssFirst.js "$PWD" /tmp/css-first-after.json
```

Для baseline использован отдельный detached worktree `c5cddd5`, без правок исходной ветки. Один сценарий: Chromium 1560×1100, 1000 ms Frame playback, затем scroll + изменение ширины до 900 и 250 ms ожидания.

| Счётчик | Прежний путь | CSS-first |
| --- | ---: | ---: |
| React commits за 1 s playback | 60 (первый прогон 61) | 1 |
| Region getBoundingClientRect за playback | 0 | 0 |
| Region getBoundingClientRect после scroll/resize | 12 | 0 |
| React commits суммарно после scroll/resize | 77 | 3 |
| Все конструкции ResizeObserver с загрузки | 13 | 10 |

Последняя строка включает сторонний UI, не означает 13/10 одновременно работающих измерителей. Дополнительный browser assertion подтверждает **0 наблюдателей регионов у обычного CSS-эффекта**. Это не замер FPS, GPU, памяти или стоимости перерисовки; заявлений об ускорении в разы нет.

Для самого обычного эффекта автору нужны три вещи: renderer с CSS, definition и регистрация с region/layer/lifetime. В runtime обязательны постоянный region/host lookup, один portal и CSS-обёртка. Раньше даже простой эффект проходил общий geometry observer/snapshot, JS placement, visibility resolver, преобразования/masks и выбор CSS/fallback; физические сцены дополнительно требовали lease и CSS-mirror. Эти обязательные пути удалены, а не переименованы.

Новая инфраструктура состоит из небольшого provider настоящих refs/hosts, одного host-компонента и одной CSS-функции размещения. Application boundary нужен для внешней области, а selection-measurement активен только в редакторе при выборе. Эти обязанности не равны по объёму удалённому общему геометрическому конвейеру: выделенный коммит удаления убрал около 1692 строк при 218 добавленных.

Оценка: для обычных эффектов система стала проще и дешевле по обязательной React-работе. Сложность художественных cross-region сцен осталась у самих renderers; они по-прежнему требуют понимания clipping, transforms и порядка DOM. Это осознанная граница стандартного API, а не обещание универсального визуального движка.
