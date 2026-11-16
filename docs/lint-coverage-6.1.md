# Аудит покрытия линтеров, этап 6.1

Дата: 16.11.2026 (Europe/Moscow). Исходная точка: `c13fa07`.
Аудит выполнен после слияния core PR #62, без изменения production-кода.
CI отсутствует; это подтверждено владельцем проекта. Новые workflows не добавлены.

## Итог

ESLint: **297 ошибок / 38 предупреждений → 1182 / 58**.
Охват отслеживаемых JS/TS-файлов: **396/563 → 564/564**.
Parser errors до/после: **0 / 0**. Диагностики всех ранее проверявшихся исходников совпадают
с исходным запуском; новые результаты относятся к расширению покрытия.
Это инвентаризация существующего кода, а не число регрессий этой задачи.

Штатные команды по-прежнему завершаются ошибкой при нарушениях. Фильтра по baseline нет.
Один новый инфраструктурный тестовый файл объясняет увеличение общего числа файлов на один;
перенос regression-тестов не создаёт копий.

## Покрытие по каталогам и расширениям

В таблице: проверено / всего отслеживаемых файлов. Generated/untracked результаты сборок
не входят в знаменатель. Для ESLint учитывается и CLI glob, и эффективная конфигурация,
а не только `calculateConfigForFile`. TS включает декларации `.d.ts`.

| Каталог | Тип | До | После |
| --- | --- | --- | --- |
| (корень) | .js | 0 / 4 | 4 / 4 |
| (корень) | .ts | 0 / 1 | 1 / 1 |
| config | .js | 0 / 1 | 1 / 1 |
| scripts | .js | 0 / 9 | 9 / 9 |
| src | .ts | 288 / 288 | 288 / 288 |
| src | .tsx | 108 / 108 | 108 / 108 |
| tests | .js | 0 / 46 | 47 / 47 |
| tests | .ts | 0 / 48 | 48 / 48 |
| tests | .tsx | 0 / 58 | 58 / 58 |

Stylelint: **63/81 SCSS → 81/81**, **0 → 2 ошибки**.
До: только `src/**/*.scss`, дополнительно исключены `reset.scss` и `__mixins.scss`.
После: все SCSS в `src/` и `tests/`, без этих двух исключений.
16 файлов тестовых приложений ранее выпадали из команды.

## Причины пробелов и изменения инфраструктуры

| Место | Было / последствие | Исправлено |
| --- | --- | --- |
| `eslint.config.js`, глобальные ignores | Все `**/*.js`, весь `scripts/` исключены независимо от содержания | Исключены только зависимости и генерируемые каталоги |
| `package.json`, ESLint glob | Команды обходили корневые тесты, инструменты и конфигурации | TS/TSX/MTS/CTS и JS/JSX/MJS/CJS проверяются двумя непересекающимися glob по всему репозиторию |
| Общий ESLint preset common | TS recommended применялся также к JS, отключая `no-undef`; CJS наследовал module | TS recommended ограничен TS; JS сохраняет recommended и `no-undef`; CJS имеет commonjs source type |
| `tests/infrastructure/lintCoverage.test.js` | Покрытие не закреплено тестом | Проверяются реальные src/tests/scripts/configs, новые виртуальные JS/MJS/CJS, окружения и generated ignores |
| `package.json`, lint-staged | Существующий hook передавал ESLint только TS/TSX | Включены все поддерживаемые расширения JS/TS; hook не запускается повторно общим runner |

Общий preset не назначает всем файлам Node/Jest globals. Он экспортирует `globals` из
стандартного одноимённого пакета: это единственная добавленная зависимость, принадлежащая
common и используемая обоими потребителями. Версии остальных зависимостей не обновлялись.
Стилистические правила, `max-params`, `max-lines`, React Hooks и type-imports не ослаблены.
Сохранены рекомендованные TS-правила и собственные параметры unused-vars.

### Окружения и parser

- Production TS/TSX и браузерные TS-фикстуры получают browser globals. У них нет Node/Jest globals.
- TypeScript в `src/` и `d.ts` использует `tsconfig.json`, корневой `tests/` — `tests/tsconfig.json`.
  `tsconfigRootDir` закреплён относительно конфигурации, а не текущей рабочей директории.
- JS явно получает `project: null`. Прежний глобальный project не мог проверять обычные
  JS-скрипты: `allowJs` не включён, и они не входят в TypeScript project. Добавлять их в
  TypeScript compilation ради ESLint не требуется.
- Инструменты, корневые конфиги, transformer и Node-тесты получают Node globals.
  Playwright-сценарии/фикстуры используют Node и browser: `page.evaluate`/`addInitScript`
  сериализуют вложенный код в страницу. То же относится к `scripts/measureCssFirst.js`.
- Jest globals и пять существующих Jest-правил ограничены тестами/помощниками в `src/`
  и `tests/jest/`. Production и Node test runner не получают Jest APIs.
  Regression-тест focused Jest теперь проверяет именно путь Jest-теста.

### Намеренно исключённые файлы

`**/node_modules/**`, выходные `lib`, `lib-esm`, `dist`, `build`, `coverage`, `tgz`,
а также `tests/visualPlayground/artifacts/`. Изображения, медиа, WASM, архивы и HTML
не являются ESLint-входами. Код браузерных приложений находится в отдельных TS/TSX-модулях.
Runtime SCSS, `d.ts`, все отслеживаемые исполняемые тесты и конфиги больше не исключены.

## Команды и общий runner

```sh
npm run lint:ts:check
npm run lint:js:check
npm run lint:css:check
npm run test:scripts
# из ../active-book-common:
npm run lint -- --repo active-book-core,active-book-editor
npm run lint:js -- --repo active-book-core,active-book-editor
```

Существующие имена сохранены. `lint:ts`/`lint:js`/`lint:css` — явные команды с `--fix`,
версии `:check` ничего не исправляют. Общий runner вызывает только три `:check`-команды,
каждую ровно один раз, продолжает после ошибок и возвращает ненулевой exit code.
`test:scripts` добавлен в группу unit-инфраструктуры ранее; новые проверки подключены к нему,
отдельной второй команды в общем наборе нет. Browser runner и runtime не изменены.
В editor локальный `check` также включает JS. CI отсутствует, автоматические CI-запуски
не заявляются: сейчас контроль выполняется npm-командами и существующим Git hook.

## Распределение ESLint по правилам

| Правило | Ошибки до | Предупр. до | Ошибки после | Предупр. после |
| --- | --- | --- | --- | --- |
| `@stylistic/array-element-newline` | 119 | 0 | 433 | 0 |
| `@stylistic/array-bracket-newline` | 100 | 0 | 328 | 0 |
| `object-newline/object-newline` | 39 | 0 | 160 | 0 |
| `@stylistic/max-len` | 0 | 0 | 110 | 0 |
| `@stylistic/padding-line-between-statements` | 0 | 0 | 36 | 0 |
| `@stylistic/curly-newline` | 0 | 0 | 32 | 0 |
| `@typescript-eslint/consistent-type-imports` | 26 | 0 | 27 | 0 |
| `max-lines` | 0 | 7 | 0 | 21 |
| `react-hooks/exhaustive-deps` | 0 | 18 | 0 | 18 |
| `max-params` | 4 | 0 | 15 | 0 |
| `@typescript-eslint/no-explicit-any` | 0 | 9 | 0 | 9 |
| `@stylistic/jsx-newline` | 4 | 0 | 8 | 0 |
| `import-x/order` | 2 | 0 | 7 | 0 |
| `curly` | 0 | 0 | 6 | 0 |
| `import-x/no-default-export` | 0 | 0 | 0 | 6 |
| `@stylistic/quotes` | 0 | 0 | 5 | 0 |
| `(неиспользуемый disable)` | 0 | 4 | 0 | 4 |
| `@typescript-eslint/no-unused-vars` | 0 | 0 | 4 | 0 |
| `object-shorthand` | 3 | 0 | 4 | 0 |
| `no-useless-escape` | 0 | 0 | 3 | 0 |
| `@stylistic/indent` | 0 | 0 | 2 | 0 |
| `@typescript-eslint/no-namespace` | 0 | 0 | 1 | 0 |
| `no-useless-assignment` | 0 | 0 | 1 | 0 |

## Распределение по каталогам

| Каталог | Файлов до → после | Ошибок до → после | Предупр. до → после |
| --- | --- | --- | --- |
| (корень) | 0 → 5 | 0 → 14 | 0 → 5 |
| config/ | 0 → 1 | 0 → 0 | 0 → 1 |
| scripts/ | 0 → 9 | 0 → 9 | 0 → 1 |
| src/@types.ts | 1 → 1 | 0 → 0 | 0 → 0 |
| src/components | 253 → 253 | 176 → 176 | 17 → 17 |
| src/controllers | 23 → 23 | 50 → 50 | 3 → 3 |
| src/hooks | 21 → 21 | 31 → 31 | 3 → 3 |
| src/pages | 5 → 5 | 1 → 1 | 2 → 2 |
| src/store | 58 → 58 | 34 → 34 | 4 → 4 |
| src/utils | 35 → 35 | 5 → 5 | 9 → 9 |
| tests/audioLifecycle | 0 → 11 | 0 → 0 | 0 → 0 |
| tests/browserFixture.js | 0 → 1 | 0 → 32 | 0 → 0 |
| tests/carousel | 0 → 7 | 0 → 0 | 0 → 0 |
| tests/dialogCarousel | 0 → 8 | 0 → 2 | 0 → 0 |
| tests/eslint | 0 → 1 | 0 → 0 | 0 → 0 |
| tests/infrastructure | 0 → 2 | 0 → 0 | 0 → 0 |
| tests/jest | 0 → 3 | 0 → 4 | 0 → 0 |
| tests/mediaContinuity | 0 → 8 | 0 → 10 | 0 → 0 |
| tests/packaging | 0 → 1 | 0 → 0 | 0 → 0 |
| tests/readerDialogs | 0 → 8 | 0 → 14 | 0 → 0 |
| tests/scssAlias | 0 → 1 | 0 → 7 | 0 → 0 |
| tests/selectionOutline | 0 → 2 | 0 → 0 | 0 → 0 |
| tests/storyDialog | 0 → 2 | 0 → 3 | 0 → 1 |
| tests/storyRoot | 0 → 8 | 0 → 43 | 0 → 1 |
| tests/storyWindows | 0 → 5 | 0 → 15 | 0 → 1 |
| tests/unifiedVisualEffects | 0 → 10 | 0 → 53 | 0 → 2 |
| tests/videoPlayback | 0 → 7 | 0 → 3 | 0 → 0 |
| tests/visualLifecycle | 0 → 12 | 0 → 43 | 0 → 1 |
| tests/visualPlacement | 0 → 11 | 0 → 247 | 0 → 2 |
| tests/visualPlayground | 0 → 45 | 0 → 386 | 0 → 5 |

## Что можно форматировать и что требует решения

ESLint помечает исправляемыми **1048 из 1182 ошибок** и
**4 из 58 предупреждений**.
Это возможность fix API, а не разрешение применить все исправления без анализа.
Оставшиеся **134 ошибок** не имеют автоматического исправления ESLint.

- Низкий риск: переносы массивов/объектов/деструктуризации, отступы и пустые строки
  в обычном JS/TS. Делать небольшими предметными наборами; проверять diff и тесты.
- Импорты: type-only imports и группировка обычно механические, но перестановка
  side-effect imports или изменение runtime-import в type-only требуют проверки сборки.
- JSX newline требует просмотра смешанного текста/пробелов; не считать его автоматически
  безопасным форматированием. Длинные строки нельзя разрывать изменением строковых значений.
- `max-params` требует осмысленного options object для собственных функций; нельзя менять
  сигнатуру callback стороннего API ради числа параметров.
- Неиспользуемые значения, ambient declarations, namespace и `no-useless-assignment`
  требуют чтения контракта и поиска использований. Не удалять сохраняемые пресеты/ресурсы.
- `max-lines` — сигнал для оценки ответственности. Не дробить тесты или конечный автомат
  по произвольному числу строк. Конфигам необходим default export по API инструмента;
  предупреждения `import-x/no-default-export` не оправдывают поломку этого API.

Приоритет форматирования — желательно/косметически; контрактов, зависимостей hooks и
скрытых assertion gaps — желательно с отдельными тестами. Критичных подтверждённых
поведенческих дефектов этим этапом не установлено: предупреждение само по себе не доказательство.

## React Hooks: все exhaustive-deps предупреждения

| Файл / строка | Диагностика |
| --- | --- |
| [`src/components/AppWrapper/components/AppContent/AppContent.tsx`](../src/components/AppWrapper/components/AppContent/AppContent.tsx#L133) | React Hook useEffect has missing dependencies: 'dispatch' and 'tableOfContents'. Either include them or remove the dependency array. |
| [`src/components/AppWrapper/components/AppContent/AppContent.tsx`](../src/components/AppWrapper/components/AppContent/AppContent.tsx#L147) | React Hook useEffect has a missing dependency: 'dispatch'. Either include it or remove the dependency array. |
| [`src/components/AppWrapper/hooks.ts`](../src/components/AppWrapper/hooks.ts#L52) | React Hook useEffect has a missing dependency: 'vibrationOff'. Either include it or remove the dependency array. |
| [`src/components/AppWrapper/hooks.ts`](../src/components/AppWrapper/hooks.ts#L102) | React Hook useEffect has missing dependencies: 'dispatch' and 'id'. Either include them or remove the dependency array. |
| [`src/components/AppWrapper/hooks.ts`](../src/components/AppWrapper/hooks.ts#L134) | React Hook useEffect has missing dependencies: 'authorComments', 'dispatch', and 'id'. Either include them or remove the dependency array. |
| [`src/components/AppWrapper/hooks.ts`](../src/components/AppWrapper/hooks.ts#L157) | React Hook useEffect has a missing dependency: 'id'. Either include it or remove the dependency array. |
| [`src/components/AppWrapper/hooks.ts`](../src/components/AppWrapper/hooks.ts#L205) | React Hook useEffect has missing dependencies: 'dispatch' and 'passedConfig'. Either include them or remove the dependency array. |
| [`src/components/Bookmarks/hooks.ts`](../src/components/Bookmarks/hooks.ts#L30) | React Hook useEffect has missing dependencies: 'bookmarks.length', 'dispatch', and 'id'. Either include them or remove the dependency array. |
| [`src/components/DotLottieReact/DotLottieReact.tsx`](../src/components/DotLottieReact/DotLottieReact.tsx#L63) | React Hook useEffect has missing dependencies: 'dispatch' and 'eventListeners'. Either include them or remove the dependency array. |
| [`src/components/DotLottieReact/DotLottieReactWrapper.tsx`](../src/components/DotLottieReact/DotLottieReactWrapper.tsx#L26) | React Hook useEffect has missing dependencies: 'amount' and 'dispatch'. Either include them or remove the dependency array. |
| [`src/components/Menu/components/FlashLight/Flashlight.tsx`](../src/components/Menu/components/FlashLight/Flashlight.tsx#L38) | React Hook useEffect has a missing dependency: 'isFlashlightAvailable'. Either include it or remove the dependency array. |
| [`src/components/Segment/Segment.tsx`](../src/components/Segment/Segment.tsx#L70) | React Hook useEffect has missing dependencies: 'defaultId' and 'dispatch'. Either include them or remove the dependency array. |
| [`src/components/Segment/Segment.tsx`](../src/components/Segment/Segment.tsx#L81) | React Hook useEffect has missing dependencies: 'dispatch', 'isActiveDefault', and 'segments'. Either include them or remove the dependency array. |
| [`src/components/Spoiler/Spoiler.tsx`](../src/components/Spoiler/Spoiler.tsx#L62) | React Hook useEffect has a missing dependency: 'setNeedToSetHeightToFalse'. Either include it or remove the dependency array. If 'setNeedToSetHeightToFalse' changes too often, find the parent component that defines it and wrap that definition in useCallback. |
| [`src/hooks/effects/audio/useAudio.ts`](../src/hooks/effects/audio/useAudio.ts#L122) | React Hook useEffect has missing dependencies: 'delay', 'dispatch', 'fadeOutWhenUnload', 'format', 'loop', 'onPause', 'onPlay', 'onStop', 'onUnload', 'playOnLoad', 'relativeVolume', 'screamer', 'stopBy', and 'type'. Either include them or remove the dependency array. If 'onUnload' changes too often, find the parent component that defines it and wrap that definition in useCallback. |
| [`src/hooks/effects/flashlight/useRain.ts`](../src/hooks/effects/flashlight/useRain.ts#L56) | React Hook useEffect has missing dependencies: 'flashlightOff' and 'flashlightOn'. Either include them or remove the dependency array. |
| [`src/hooks/effects/useFont.ts`](../src/hooks/effects/useFont.ts#L29) | React Hook useEffect has a missing dependency: 'dispatch'. Either include it or remove the dependency array. |
| [`src/pages/Page0/Page0.tsx`](../src/pages/Page0/Page0.tsx#L99) | React Hook useEffect has missing dependencies: 'audioSrcForInit' and 'dispatch'. Either include them or remove the dependency array. |

Ручной разбор необходим прежде добавления deps:

- `useAudio` использует `formatKey` вместо нестабильного массива `format`, а callbacks
  и options могут меняться при каждом рендере. Добавление всего списка способно вызвать
  cleanup/пересоздание аудио, повторную загрузку и изменение manual lifetime.
  Нужны rerender/смена options/StrictMode/отмена cleanup тесты; аудио в 6.1 не изменяется.
- `useSetUpConfig` и инициализация all-pages-seen выполняются при mount. Превращение их
  в реакцию на каждый новый объект config может сбрасывать настройки читателя.
  Сначала определить поддержку смены книги/id без remount и проверить localStorage ключи.
- `useBeforeUnloadHandler` захватывает id, но реагирует только на page: возможна запись
  по старому ключу при смене id на той же странице. Проверить сценарий, не объявлять багом без контракта.
- Обработчики видимости, Segment, Spoiler, Lottie и flashlight могут захватывать старые
  значения/функции. Проверять подписки, повторное создание, разблокировку и cleanup отдельно.
  Восстановленный `useRain.ts` — сохраняемый пресет, а не повод удалить файл по предупреждению.

Дополнительные кандидаты на ручное рассмотрение: initial assignment `hasPlayed` в
`tests/visualPlayground/Playground/Playground.tsx:73`, unused `before` в
`tests/visualPlacement/visualPlacement.browser.test.js:291`, unused callback `element`
в `tests/unifiedVisualEffects/unifiedVisualEffects.browser.test.js:80`.
Неиспользуемая переменная в тесте может указывать на потерянное сравнение; удалять её без
чтения assertions нельзя. Ambient NodeJS/isDemoMode в `d.ts` требуют проверки глобального
контракта, а не автоматического удаления. Девять `any` сосредоточены в Toggle (1),
flashlight (7), getIsMobile (1): внешние browser API нужно сужать, не заменять `any` на assertion.

Две новые ошибки SCSS: `src/styles/__mixins.scss:10` и `:52`, `order/order`.
Sass вычисляет переменные внутри `@if` перед декларациями; механический перенос
деклараций выше `@if` может изменить итоговый CSS. Нужен отдельный анализ с сравнением
скомпилированных веток mixin, а не автоматическая перестановка или новое исключение файла.

## Все max-lines предупреждения

Указано эффективное число строк ESLint (без пустых строк и комментариев), лимит 150.

| Файл | Строк |
| --- | --- |
| [`scripts/scssAlias.js`](../scripts/scssAlias.js) | 303 |
| [`src/components/AppWrapper/components/AppContent/AppContent.tsx`](../src/components/AppWrapper/components/AppContent/AppContent.tsx) | 179 |
| [`src/components/AppWrapper/hooks.ts`](../src/components/AppWrapper/hooks.ts) | 154 |
| [`src/controllers/visualEffects/createVisualEffects.ts`](../src/controllers/visualEffects/createVisualEffects.ts) | 219 |
| [`src/controllers/visualEffects/tests/createVisualEffects.test.ts`](../src/controllers/visualEffects/tests/createVisualEffects.test.ts) | 192 |
| [`src/controllers/visualEffects/utils/tests/declarations.test.tsx`](../src/controllers/visualEffects/utils/tests/declarations.test.tsx) | 261 |
| [`src/pages/Page0/Page0.tsx`](../src/pages/Page0/Page0.tsx) | 154 |
| [`src/utils/effects/audio/HowlWrapper.ts`](../src/utils/effects/audio/HowlWrapper.ts) | 603 |
| [`tests/storyDialog/storyDialog.browser.test.js`](../tests/storyDialog/storyDialog.browser.test.js) | 171 |
| [`tests/storyRoot/storyRoot.browser.test.js`](../tests/storyRoot/storyRoot.browser.test.js) | 162 |
| [`tests/storyWindows/windowHistory.browser.test.js`](../tests/storyWindows/windowHistory.browser.test.js) | 243 |
| [`tests/unifiedVisualEffects/EffectsBook/EffectsBook.tsx`](../tests/unifiedVisualEffects/EffectsBook/EffectsBook.tsx) | 154 |
| [`tests/unifiedVisualEffects/unifiedVisualEffects.browser.test.js`](../tests/unifiedVisualEffects/unifiedVisualEffects.browser.test.js) | 173 |
| [`tests/visualLifecycle/visualLifecycle.browser.test.js`](../tests/visualLifecycle/visualLifecycle.browser.test.js) | 247 |
| [`tests/visualPlacement/storyRegions.browser.test.js`](../tests/visualPlacement/storyRegions.browser.test.js) | 186 |
| [`tests/visualPlacement/visualPlacement.browser.test.js`](../tests/visualPlacement/visualPlacement.browser.test.js) | 289 |
| [`tests/visualPlayground/Controls/Controls.tsx`](../tests/visualPlayground/Controls/Controls.tsx) | 243 |
| [`tests/visualPlayground/Playground/Playground.tsx`](../tests/visualPlayground/Playground/Playground.tsx) | 276 |
| [`tests/visualPlayground/persistentStory.browser.test.js`](../tests/visualPlayground/persistentStory.browser.test.js) | 269 |
| [`tests/visualPlayground/registrations.ts`](../tests/visualPlayground/registrations.ts) | 187 |
| [`tests/visualPlayground/visualPlayground.browser.test.js`](../tests/visualPlayground/visualPlayground.browser.test.js) | 364 |

Отдельно рассмотреть HowlWrapper (владение голосами/отмена), createVisualEffects
(регистрации/жизненный цикл), scssAlias (резолвинг/запись), Playground и крупные browser suites.
Вынесение операций должно следовать независимой ответственности и сохранять порядок
побочных эффектов. Это отдельные PR; 6.1 не меняет эти модули.

## Подавления правил

Четыре `eslint-disable-next-line @typescript-eslint/no-unused-vars` в
`src/store/counter/slice.ts:16,18` и `src/store/segments/slice.ts:27,29` уже не используются:
underscore-параметры разрешены общей конфигурацией. Это четыре предупреждения, присутствовавшие
и до 6.1. В 6.2 можно удалить сами директивы, сохранив reducers и saga contracts.
File-wide/off для hooks и `stylelint-disable` в отслеживаемом коде не найдены.
Главное прежнее подавление — blanket JS/scripts ignores — удалено, новых выключений правил нет.

## Последовательность небольших PR этапа 6.2

1. Core TS type-imports и форматирование массивов/объектов отдельно по store, hooks,
   controllers, затем components; каждый предметный PR: typecheck + unit соответствующей области.
2. JS tooling/configs: `scssAlias.js`, `visualPlayground.js`, `jest.config.js`; без смены
   сигнатур внешнего API и резолвинга. Проверки: test:scripts, SCSS alias, build.
3. Browser helpers и сценарии по доменам: visualPlacement → visualPlayground → прочие;
   разбирать потерянные assertions, а не удалять unused вслепую. Проверять соответствующие browser suites.
4. TS-приложения/фикстуры `tests/` по доменам, отдельно ambient `d.ts`/Jest mocks.
   Проверки: typecheck:test + связанные browser/Jest + упаковка.
5. `__mixins.scss`: отдельный PR после сравнения CSS на ветках условий; Stylelint +
   SCSS alias + build и визуальная проверка потребителя. Удаление четырёх unused disables
   можно сделать независимым маленьким PR без изменения reducers.
6. Hooks dependency audit отдельными PR по AppWrapper/book identity, DOM подпискам и audio.
   Сначала regression tests поведения при обновлении параметров и cleanup, потом решение deps.
7. Крупные реализации — самостоятельное ревью ответственности после механических правок;
   HowlWrapper и visual session не смешивать с форматированием/переносом тестов.
   Сохранять предупреждение с обоснованием, если дробление не улучшает код.

## Воспроизведение измерений

```sh
npm run lint:ts:check -- --format json --output-file /tmp/lint-ts.json
npm run lint:js:check -- --format json --output-file /tmp/lint-js.json
npm run lint:css:check -- --formatter json
```

Сложить severity=2 и severity=1 по двум непересекающимся JSON-отчётам. `fixableErrorCount`
не включает предупреждения. Исходные счётчики получены старой штатной командой на указанном
main; после — ESLint API с теми же конфигами по всем файлам и реальным запуском common runner.
Полные диагностические JSON временные, в пакет и репозиторий не включены.

## Результаты проверок

| Проверка | Результат |
| --- | --- |
| `typecheck`, `typecheck:test` | Оба проходят |
| `test:unit` | 349 тестов, 47 suites, проходят |
| `test:scripts` | 26 тестов, проходят; покрытие линтера, размещение тестов, browser manifest, transformer, воспроизводимость build/pack |
| `test:scss-alias` | 8 тестов, проходят |
| `test:browser` | Все 133 теста проходят, последовательный запуск сохранён |
| `build` | Проходит; production/source не изменены |
| `lint:ts:check` | 550 ошибок, 43 предупреждения; исходный долг плюс ранее непроверяемые TS-фикстуры/declarations |
| `lint:js:check` | 632 ошибки, 15 предупреждений в ранее непроверяемых файлах |
| `lint:css:check` | 2 ошибки `order/order` в ранее исключённом mixin |
| Изменённые ESLint config/regression/coverage files | 0 ошибок; 1 предупреждение о необходимом default export конфигурации |
| `git diff --check` | Проходит |

После последнего расширения Jest-окружения для JS-тестов в `src/` отдельно повторён
coverage suite: 4/4. Production-код не изменялся. В browser логе встречается сообщение Vite о ResizeObserver loop;
оно не вызвало падения тестов и этим этапом не исправляется.

Связанный shared PR: [common #5](https://github.com/KrimsonKing1337/active-book-common/pull/5).
Его нужно объединить первым: локальный consumer использует новый именованный экспорт `globals`.
Общий `test:infra` — 60/60. В common исправлены старые flat-config обращения array-format suite
и ожидание текста deps-sync diagnostic; алгоритм deps-sync не менялся.
