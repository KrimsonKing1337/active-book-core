# Регрессии тестов после финализации регионов

Исходная ветка: `experiment/story-regions-finalization`, core `007671a`, editor `b926bb5`, types `3283454`. Исправления находятся в `fix/story-regions-test-regressions`; Draft PR направлены в исходную экспериментальную ветку. Main и предыдущие ветки рефакторинга не изменялись, merge не выполнялся.

## Воспроизведение и восемь записей о падении

В облачном Linux/Chromium до изменений прошли **40 Jest и 61 browser core**, types и bundler tests. Полный editor воспроизвёл **1 failed / 79 passed**. После этого автор прислал Windows stack traces core. Различие платформ объясняет, почему ошибки путей не проявились в Linux.

В присланном фрагменте core перечислены **шесть самостоятельных сценариев**: один в finalDemos и пять в visualPlayground. Node test runner также считает проваленным родительский test `visual playground experiments in Chromium`: пять дочерних ошибок + родитель + finalDemos дают семь failed. Повторный `test:visual-lab` запускает те же пять сценариев, а не пять новых дефектов.

| № | Упавший тест | Первопричина и классификация |
| --- | --- | --- |
| 1 | `frame and through effects select viewport, narrative or Toolbar without coupling their plane` | Ошибка синхронизации теста: после смены региона locator мог получить уже отсоединённую поверхность; `node.parentElement` был null. Два requestAnimationFrame не гарантируют завершения React commit и переноса portal. |
| 2 | `local surfaces match real regions, toolbar variations and CSS frame anchors` | Ошибка тестовой инфраструктуры Windows: screenshot `01-frame-local.png` получал путь из URL.pathname с ведущим `/D:/`. |
| 3 | `native content surfaces scroll and fixed viewport overlays retain DOM and animation` | Та же ошибка пути для `02-native-scroll.png`; assertions идентичности/scroll до screenshot не были причиной. |
| 4 | `external overlay covers a smaller story; underlay is occluded including rounded viewport corners` | Та же ошибка пути для `04-external-darkness.png`. |
| 5 | `smoke and a single wave cross regions without renderer replacement; feedback stays above overlays` | Та же ошибка пути для `06-css-smoke.png`. |
| 6 | `visual transform collapse reaches zero and restores without changing layout or leaking animations` | Та же ошибка пути для `09-collapse-transform.png`. |
| 7 | `visual playground experiments in Chromium` | Агрегат пяти упавших дочерних сценариев № 2–6, без отдельной первопричины. |
| 8 | Editor: `shared placement controls save transforms, layer and mixed units while focused` | Ошибка теста: control переименован в «Сбросить размещение», locator остался «Заполнить область». |

Реальные сообщения до исправления (Windows core предоставлен автором, editor воспроизведён здесь):

```text
locator.evaluate: TypeError: Cannot read properties of null (reading 'dataset')
  at host (D:\Projects\activeBook\activeBook-react-core-next\scripts\finalDemos.browser.test.js:17:57)
  at TestContext.<anonymous> (...\scripts\finalDemos.browser.test.js:69:24)

Error: ENOENT: no such file or directory, open
'D:\D:\Projects\activeBook\activeBook-react-core-next\tests\visualPlayground\artifacts\01-frame-local.png'
  at async _Page.screenshot (...\node_modules\playwright-core\lib\coreBundle.js:63324:11)
  at async .../scripts/visualPlayground.browser.test.js:156:5
```

У остальных четырёх screenshot-ошибок тот же стек записи файла; исходные строки вызовов — 180, 213, 243, 295 соответственно.

```text
TimeoutError: locator.click: Timeout 10000ms exceeded.
  waiting for ...getByRole('button', { name: 'Заполнить область', exact: true })
  apps/editor/src/components/EditorScreen/EditorScreen.browser.test.tsx:305:5
```

Полные локальные логи воспроизведения и итоговых browser-прогонов сохранены рядом: [evidence](story-regions-test-regressions/). Они не подменяют отсутствующий полный Windows-прогон.

## Исправления тестовой инфраструктуры

Screenshot API получает `fileURLToPath(new URL(...))` вместо pathname во всех восьми вызовах галереи, включая вызовы, до которых Windows прежде не доходил. Аналогичный вызов исправлен в unifiedVisualEffects. Node fs API по-прежнему получает поддерживаемые им URL напрямую. Новой собственной обёртки для файловых путей нет.

Проверена Windows-конверсия стандартным Node API: `file:///D:/Projects/activeBook/.../01-frame-local.png` становится `D:\Projects\activeBook\...\01-frame-local.png`; pathname возвращал `/D:/Projects/...`. Playwright затем разрешал такой путь относительно текущего диска, образуя `D:\D:\...`.

В finalDemos patch ждёт публикации **заданных значений settings**. Проверка host ждёт подключения поверхности именно к **ожидаемому региону**, а не просто появления произвольного элемента. Отсутствующий или неверный host теперь приводит к диагностируемому timeout, а не к TypeError или пропуску проверки. Сравнения размеров artwork, planes, CSS-анимаций, пикселей, identity и интерактивности сохранены. Production portal/lifecycle ради теста не менялись.

В editor обновлён locator reset-кнопки; сохранена проверка, что reset действительно удаляет transforms и оставляет выбранный регион.

## Отдельный production-дефект editor

VisualRegionSettings при выборе storyViewportFrame/toolbarFrame перезаписывал `visibility.sides` всеми четырьмя сторонами. Это реальная потеря авторских данных, дополнительная к перечисленным инфраструктурным падениям.

Теста `switching frame regions preserves custom side widths and the selected sides` в удалённой исходной ветке не было. Добавлены он и два сценария — отключённая маска с сохранёнными толщинами и явно пустой sides. Все три падали на исходном коде. Например:

```text
AssertionError: expected last "vi.fn()" call to have been called with ...
- sides: ['top', 'right', 'left']
+ sides: ['top', 'right', 'bottom', 'left']
  at assertRegionChangesPreserveVisibility (.../VisualRegionSettings.component.test.tsx:47:26)
```

Теперь смена региона вызывает только updatePlacement. Visibility, индивидуальные px/% толщины, отключённые стороны, пустая/выключенная маска и depth не меняются. Фабрики новых эффектов сохранены: Frame создаётся в storyViewportFrame под нарративом со своими художественными defaults; автор включает маску отдельной подписанной галкой. Автоматического включения маски при выборе региона больше нет ни у Frame, ни у Background.

Browser-сценарий проходит через toolbarFrame → storyViewportFrame → narrativeFrame → toolbarFrame с отключённым низом и разными толщинами, затем duplicate/save/reopen. Повторные смены региона после отключения всей маски не включают её заново. Копия остаётся независимой.

## Маски, Toolbar, spinner и StoryRoot

У getFrameMaskImage, `--visual-frame-top/right/bottom/left`, uniform `--visual-frame-width` и `mask-composite: add` не найдено production-регрессии, объясняющей присланные ошибки. Эти механизмы не переписаны ради совпадения тестов.

Новая pixel-проверка измеряет границу каждой полосы изнутри и снаружи, центр остаётся прозрачным. Для native linear-gradient **top/bottom % относятся к высоте**, **left/right % — к ширине**: проценты color stops считаются по длине линии соответствующего градиента. Проверены uniform 20% и четыре разных процента до и после реального flex-wrap Toolbar на 390px. Изменение маски не меняет Toolbar bounds или padding текста при том же размере viewport. Адаптивный padding при самом resize вправе изменяться.

Reader/editor browser-проверка spinner подтверждает relative containing block AppWrapper, видимость pseudo-element и равенство его отступов внутри реальной книги после resize. Удаление неиспользуемого StoryRoot ref не потребовало исправлений: существующие identity/StrictMode/cleanup сценарии проходят.

Постоянный DOM, CSS-first placement, девять регионов, независимость visibility/depth, range CSSAnimation/Canvas и отсутствие покадрового React progress сохранены. Геометрический или анимационный менеджер не добавлен.

## Свежая сборка и вся цепочка

Собран новый **core 0.0.53** и установлен его новый TGZ в editor с новой integrity. Старый архив не подменялся. Types **0.0.3** уже содержат актуальный per-side контракт; изменений в types не потребовалось.

Сравнение байтов установленных и собранных VisualSurface.js, FrameEffects/utils.js, StoryRoot.js и AppWrapper SCSS подтвердило, что editor использует новую сборку с per-side масками и локальным spinner, а не прежний пакет 0.0.52.

Production runtime теперь явно включает маску, задаёт top 8px / right 16px / bottom 11px / left 4%, отключает bottom и проходит edit/save/reopen/reorder/add/delete → export/build → reader. В готовой книге проверены region/host/bounds, значения native maskImage и отсутствие gradient для отключённого bottom. Галочки маски ищутся внутри группы «Маска сторон», отдельно от художественных сторон FrameShadow.

## Проверки после исправления

| Проверка | Результат |
| --- | --- |
| Types typecheck, compile tests, bundler tests | Прошли |
| Core source и fixture TypeScript | Прошли |
| Core Jest | 40 passed |
| Core SCSS-alias tests | 8 passed |
| Core полный test:browser | 62 passed, 0 failed |
| Editor workspace/test TypeScript | Прошёл, включая расширенный production runtime |
| Editor полный npm test | 83 passed: 62 unit, 7 component, 14 browser |
| Editor build:editor | Прошёл на установленном core 0.0.53 |
| Production reader runtime | 1 passed, 0 failed |
| ESLint изменённых editor TS/TSX | 0 errors, 2 max-lines warnings |
| Изменённые JS test scripts | node --check и browser-прогоны прошли; JS scripts исключены конфигурацией ESLint |
| Полный core ESLint | Выполнен: 106 существующих errors, 40 warnings в исходном коде |
| Полный core Stylelint | Выполнен: 17 существующих errors в 5 неизменённых SCSS-файлах |
| Полный editor ESLint | Выполнен: 8 существующих errors, 36 warnings в неизменённых файлах |
| Полный editor Stylelint | Прошёл |

Полный lint **не зелёный**. Падения core — прежние curly/format/import-order и SCSS order/color-hex-length; production TS/SCSS core в этой ветке не менялись. Оставшиеся editor errors находятся в CustomComponentsWarningModal, FrameMaskSettings, resolveBackgroundPreview и visualEffects.test.ts; эти файлы совпадают с исходной веткой. Новых lint errors в затронутом коде нет. Массовое форматирование несвязанных модулей не выполнялось, правила не отключались.

## Коммиты и пределы готовности

Core: [c9e1e4f](https://github.com/KrimsonKing1337/active-book-core/commit/c9e1e4f) — переносимость screenshot paths; [8e7dbcc](https://github.com/KrimsonKing1337/active-book-core/commit/8e7dbcc) — ожидание commit/host; [cc00f54](https://github.com/KrimsonKing1337/active-book-core/commit/cc00f54) — проверки процентов и spinner; [066e59d](https://github.com/KrimsonKing1337/active-book-core/commit/066e59d) — новый пакет 0.0.53. Editor: [0491494](https://github.com/KrimsonKing1337/active-book-editor/commit/0491494) — сохранение масок и регрессии; [fe15449](https://github.com/KrimsonKing1337/active-book-editor/commit/fe15449) — актуальный reset locator; [6eca355](https://github.com/KrimsonKing1337/active-book-editor/commit/6eca355) — TGZ; [b93e469](https://github.com/KrimsonKing1337/active-book-editor/commit/b93e469) — форматирование новых assertions; [a492ec4](https://github.com/KrimsonKing1337/active-book-editor/commit/a492ec4) — production reader с асимметричной маской. Документация и evidence вынесены в отдельные коммиты.

Полный Windows runner здесь недоступен: ошибки Windows диагностированы по присланным stack traces и преобразованию Windows file URL, повторные browser-прогоны выполнены в Linux/Chromium. Перед main нужен Windows test:browser/test:visual-lab/editor test, включая платформенные screenshots. Аппаратные возможности iOS/Android также остаются ручной проверкой. Существующий lint debt требует отдельного решения перед строгим общим lint gate. Vite предупреждает о размере chunks; это предупреждение сохранено. Миграции, конфликты пользовательских анимаций, video, branching/history и новые менеджеры вне задачи.
