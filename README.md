# @active-book/core

Браузерный движок ActiveBook для иммерсивных историй: текст, изображения,
видео, фоновое аудио, интерактивные компоненты и визуальные эффекты в одном reader.
Тот же движок используется для предпросмотра книги в редакторе.

Проект находится **до первого релиза**. На текущем поколении движка ещё нет выпущенных
книг; в репозиториях есть демонстрации и тестовые сценарии. Публичный API пока меняется.

## Место в проекте

Ядро использует React 19, Redux Toolkit и redux-saga. Компоненты формируют поверхность
книги и её DOM-регионы, общая визуальная сессия управляет регистрацией background/frame
эффектов и их временем жизни, включая страницы и диапазоны. Аудио и видео используют
браузерные API; воспроизведение может требовать первого действия пользователя.
Вибрация и фонарик доступны только там, где их поддерживают браузер, устройство и разрешения.

Редактор, сборщик и production reader находятся в [active-book-editor](https://github.com/KrimsonKing1337/active-book-editor/blob/main/README.md),
публичные контракты расширений — в [active-book-types](https://github.com/KrimsonKing1337/active-book-types/blob/main/README.md),
конфигурации и соглашения — в [active-book-common](https://github.com/KrimsonKing1337/active-book-common/blob/main/README.md).

## Установка и сборка

Нужны Node.js **24 LTS** (24.15+ в ветке 24.x), npm **11.x** и соседние common/types.
Точная проверяемая версия в `.nvmrc` — **24.19.0**, npm — **11.9.0**.
[Общая инструкция с клонированием четырёх репозиториев](https://github.com/KrimsonKing1337/active-book-common/blob/main/README.md#установка-с-нуля-и-запуск-редактора).

После установки common и types, из корня core:

```sh
npm ci
npm run build
```

`build` очищает и пересоздаёт `lib/`, компилирует production TypeScript, копирует
ресурсы и преобразует JS/SCSS aliases в относительные пути. Он не меняет исходники,
версию и lockfile. `lib/` не хранится в Git. dotLottie WASM копируется из зависимости
непосредственно в `lib/src/vendors/`, без записи в `src/`.

Требования инструментов разработки проверяются npm через `devEngines`.
`engines.node` пакета сохраняет более широкий диапазон для потребителей: готовый
браузерный пакет не требует, чтобы сборщик каждого потребителя работал на Node.js 24.
Проверенный путь разработки этого репозитория — Node.js 24/npm 11; Node.js 20/22 здесь
не проверялись. Сам reader работает в браузере, не в Node.js.

## Использование локального пакета

В editor настроено `@active-book/core: file:../active-book-core`. До `npm ci` в editor
нужно установить и собрать core. После изменения ядра выполните в editor
`npm run core:build` и перезапустите dev-сервер. Установка/перепаковка TGZ для этого не нужна.

Корневого импорта `@active-book/core` нет. Используйте объявленные в `exports` подмодули:

```tsx
import type { Config } from '@active-book/core/@types';

import { App, P } from '@active-book/core/components';
import { StoreProvider } from '@active-book/core/store';
```

JS и декларации разрешаются непосредственно в `lib/src/`: TypeScript находит соседний
`.d.ts` при разрешении экспортированного `.js`. Шаблон `./*` открывает
собранные модули на любой глубине, например
`@active-book/core/controllers/visualEffects/utils/lifetime`.
Для каталогов указывайте `/index`, например `@active-book/core/store/windows/index`;
существующие короткие пути к каталогам, такие как `components` и `store/config`, сохранены явно.
Node.js не ищет `index.js` автоматически при разрешении exports.
Строгие границы публичного API будут обсуждаться при разработке SDK (issue #66).

Пакет предназначен для браузерного сборщика с обработкой React, SCSS и SVG; импорт всего UI обычным Node.js
не является поддерживаемым способом запуска. Editor и book-builder уже настраивают
эту обработку и dedupe `react`/`react-dom` для связанных локальных пакетов.

Ресурсы доступны по `@active-book/core/styles/*`, `assets/*`, `vendors/*`.
Приложения подключают базовые стили common перед `@active-book/core/styles/styles.scss`.
Существующий Vite-плагин editor/builder обслуживает и включает WASM по URL
`/vendors/dotlottie-player.wasm`. Тесты ресурсов проверяют также SVG, постер и шрифты.

## Production-упаковка

```sh
npm run build
npm run packaging
```

`packaging` создаёт `tgz/active-book-core-<version>.tgz` из готовой сборки.
`make` последовательно выполняет build и packaging; версия изменяется только отдельной
явной командой `npm run up`. Для обычной разработки достаточно `build`.
Архив не устанавливается в editor автоматически.

В архив входят `lib/src/`, metadata, README и лицензия. Тесты, фикстуры, Jest setup,
инструменты и диагностические материалы исключены. `postinstall` не нужен.
Настройка `publishConfig.access: public` относится к будущей публикации, а не подтверждает,
что текущая версия опубликована или публичный API стабилен.

## Проверки

```sh
npm run typecheck
npm run typecheck:test
npm run test:unit
npm run test:scripts
npm run test:scss-alias
npm run lint:ts:check
npm run lint:css:check
```

Для настоящего Chromium установите браузер из editor (`npx playwright install chromium`)
либо задайте `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, затем запустите здесь:

```sh
npm run test:browser
```

Browser runner выполняет сценарии последовательно. На время упаковочных тестов
остановите dev-сервер, использующий core. Не запускайте упаковочные тесты
параллельно с ручным `build`: они также пересобирают `lib/`.
В исходниках есть известный долг ESLint; его устранение не является частью установки.
`lint:ts`/`lint:css` применяют исправления — для просмотра используйте варианты `:check`.
[Подробный состав тестов и фикстур](tests/README.md).

## Структура и технические материалы

- `src/components/` — reader, типографика, медиа, диалоги и визуальные поверхности.
- `src/controllers/visualEffects/` — определения, регистрации и жизненный цикл эффектов.
- `src/hooks/`, `src/store/`, `src/utils/` — API ядра, состояние и служебная логика.
- `src/styles/`, `src/assets/` — runtime-стили, изображения и шрифты.
- `scripts/` — инструменты сборки и запуска проверок; тестов и фикстур здесь нет.
- `tests/` — самостоятельные browser/infrastructure сценарии; модульные тесты также есть в `src/`.
- `lib/`, `tgz/` — генерируемые результаты сборки и упаковки.

[Визуальная сессия Background/Frame](docs/unified-background-frame.md),
[DOM-регионы и Toolbar](docs/story-regions-finalization.ru.md),
[лаборатория и демонстрации](tests/visualPlayground/README.md).
`npm run dev:visual-lab` работает из текущего checkout; старые экспериментальные ветки
для запуска не требуются. Материалы экспериментов описывают историю решений.

## История проекта

Предыдущее поколение движка и созданные для него книги сохранены отдельно:
[Over the Garden Wall](https://github.com/KrimsonKing1337/active-book-over-the-garden-wall-legacy),
[Fairytale Forest](https://github.com/KrimsonKing1337/active-book-fairytale-forest-legacy),
[исторический сайт](https://active-books.ru).
Они не демонстрируют выпуск книг на текущей реализации ActiveBook.

[Общие соглашения](https://github.com/KrimsonKing1337/active-book-common/blob/main/CODING_CONVENTIONS.md), [инструкции для агентов](AGENTS.md).
