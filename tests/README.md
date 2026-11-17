# Проверки core

Общие правила размещения тестов и фикстур:
[Общие соглашения ActiveBook](https://github.com/KrimsonKing1337/active-book-common/blob/main/CODING_CONVENTIONS.md#тесты).
Локальные инструкции агента и ссылка на соседний checkout common находятся в [AGENTS.md](../AGENTS.md).

## Команды

| Команда | Состав |
| --- | --- |
| `npm run typecheck` | Исходники и локальные Jest-тесты в `src/` |
| `npm run typecheck:test` | TypeScript-фикстуры и служебные TS-файлы корневого `tests/` |
| `npm run test:unit` | Jest: unit/component-тесты в `src/` |
| `npm run test:scripts` | Node: ESLint, Jest transformer, размещение тестов, browser manifest и production-упаковка |
| `npm run test:scss-alias` | Node: SCSS alias unit/CLI-тесты |
| `npm run test:browser` | Node + Playwright: все браузерные сценарии последовательно |
| `npm run test:visual-lab` | Поднабор browser: только visual playground |

`npm test` и `test:coverage` по-прежнему используют Jest. Node-тесты в корневом `tests/`
не входят в Jest `testMatch`. Общий runner common запускает `test:unit`, `test:scripts`,
`test:scss-alias` и `test:browser`; `test:visual-lab` в общий набор не включён, поэтому
браузерные сценарии не дублируются.

Установите Chromium через Playwright либо задайте `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
Например, на Linux с системным браузером:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

## Каталоги и фикстуры

Корневые предметные каталоги содержат браузерные сценарии и обслуживающие их приложения.
Адреса приложений `/tests/<область>/` сохранены. Общая Playwright/Vite-фикстура находится
в `browserFixture.js`; предметные `*Fixture.js` находятся рядом со своими сценариями.
`jest/` содержит transformer tests, Jest setup и SVG mock; `eslint/`, `scssAlias/` и
`infrastructure/` содержат соответствующие Node-проверки.

Локальные тесты visualEffects сгруппированы в `src/controllers/visualEffects/tests/`
и `src/controllers/visualEffects/utils/tests/`. Одиночный тест хука остаётся рядом с ним;
общая фикстура этой подсистемы находится в её `tests/testFixtures.ts`.

## Сценарии, перенесённые из scripts/

Имена файлов сохранены; всего перенесено 28 тестовых файлов, включая 27 browser-файлов.

| Каталог внутри tests/ | Файлы |
| --- | --- |
| `carousel/` | `carousel.browser.test.js`, `carouselContent.browser.test.js`, `carouselInteraction.browser.test.js` |
| `dialogCarousel/` | `dialogCarousel.browser.test.js`, `dialogCarouselLayout.browser.test.js`, `dialogCarouselFocus.browser.test.js` |
| `videoPlayback/` | `videoPlayback.browser.test.js`, `videoDialogs.browser.test.js`, `videoLoading.browser.test.js` |
| `readerDialogs/` | `readerDialogs.browser.test.js`, `confirmDialogs.browser.test.js`, `readerNotices.browser.test.js` |
| `storyWindows/` | `storyWindows.browser.test.js`, `windowHistory.browser.test.js` |
| `storyDialog/` | `storyDialog.browser.test.js` |
| `storyRoot/` | `storyRoot.browser.test.js` |
| `selectionOutline/` | `selectionOutline.browser.test.js` |
| `visualPlacement/` | `visualPlacement.browser.test.js`, `localSurfaces.browser.test.js`, `storyRegions.browser.test.js` |
| `visualLifecycle/` | `visualLifecycle.browser.test.js` |
| `unifiedVisualEffects/` | `unifiedVisualEffects.browser.test.js` |
| `visualPlayground/` | `visualPlayground.browser.test.js`, `nativeAnimations.browser.test.js`, `persistentStory.browser.test.js`, `finalDemos.browser.test.js` |
| `mediaContinuity/` | `mediaContinuity.browser.test.js` |
| `scssAlias/` | `scssAlias.test.js` |

`scripts/runBrowserTests.js` остаётся инструментальным раннером. Его manifest проверяется
через `test:scripts`: каждый browser-файл должен быть указан ровно один раз. Там же
проверяется отсутствие тестовых файлов, импортов `node:test` и именованных тестовых
фикстур в `scripts/`. Инструментальный `measureCssFirst.js` использует общую фикстуру
из `tests/browserFixture.js`.

Диагностические материалы playground по-прежнему записываются в
`visualPlayground/artifacts/`; reviewed Linux baseline остаётся в
`unifiedVisualEffects/screenshots/`. Обычный прогон не обновляет baseline.
