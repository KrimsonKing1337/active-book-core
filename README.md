# @active-book/core

https://active-books.ru

ActiveBooks — Живые книги

Живые книги — это формат цифрового повествования, в котором текст, звук, анимация и визуальные эффекты работают вместе, усиливая погружение, но не разрушая саму суть чтения. Также используются вспышка и вибрация (там где доступно).

Живая книга — это линейная история (без ветвлений и переменных), в которой:

+ Текст остаётся главным носителем смысла
+ Музыка и звуки сопровождают страницы
+ Анимации и эффекты усиливают атмосферу сцены
+ Визуальный стиль может меняться вместе

Этот репозиторий — это движок живых книг, который называется ActiveBook.

Исторические примеры на предыдущем поколении движка сохранены в архивах: \
https://github.com/KrimsonKing1337/active-book-over-the-garden-wall-legacy \
https://github.com/KrimsonKing1337/active-book-fairytale-forest-legacy

Почитать можно здесь (не работает во встроенном браузере телеграмма и аналогов): \
https://active-books.ru

## Локальная разработка

Разместите `active-book-core`, `active-book-editor` и `active-book-types` в соседних каталогах.
В types и core выполните `npm ci`, затем запустите `npm run core:package` из editor.
Скрипт соберёт `@active-book/core`, создаст архив `active-book-core-<version>.tgz`
и обновит локальную зависимость редактора. Публикация в npm для этого не нужна.

Пакет настроен как публичный npm-пакет в scope `@active-book` (`publishConfig.access: public`).
Перед будущей публикацией необходимо проверить права аккаунта на этот scope;
наличие имени в конфигурации само по себе не предоставляет права публикации.

Текущая архитектура Background/Frame: [общая визуальная сессия](docs/unified-background-frame.md).


## Экспериментальная лаборатория эффектов

В ветке `experiment/visual-effects-playground` запустите `npm run dev:visual-lab`.
[Результаты CSS/JS-сравнения, управление эффектами и визуальные материалы](docs/visual-playground.md).

Текущий эксперимент `experiment/css-first-story-surfaces`: [CSS-first DOM-регионы, карта коммитов, проверки и замеры](docs/css-first-story-surfaces.ru.md).

Финализация: [DOM-регионы, Toolbar, маски, анимации и готовность к интеграции](docs/story-regions-finalization.ru.md).

Regression follow-up: [Windows test paths, portal readiness, masks and package validation](docs/story-regions-test-regressions.ru.md).


## Shared development infrastructure

Clone the ActiveBook repositories as siblings. Install `active-book-common` first,
then this repository; it has the devDependency `@active-book/common: file:../active-book-common`.
Coding conventions for human contributors and agents:
[ActiveBook coding conventions](https://github.com/KrimsonKing1337/active-book-common/blob/main/CODING_CONVENTIONS.md).
Agents should also read `../active-book-common/AGENTS.md` and this repository's
`AGENTS.md` for task-specific workflow.
Shared configurations load directly through the common package exports; no copied
configuration snapshots or standalone-clone fallback are maintained.

The common repository supplies grouped `check`, `typecheck`, `lint`, and `test`
commands, each with `--repo` filtering. `check` and `test` include browser/runtime
suites; choose `test:unit` or another subgroup for a narrower run. `deps:sync`
applies standard npm section policies to already declared packages and workspaces.
See the common README for installation order, groups, presets and policy semantics.

ESLint extends `@active-book/common/eslint`; only project aliases, ignores and local
rules remain here. Stylelint reexports `@active-book/common/stylelint`, including
its SCSS rules and property ordering. `lint:ts:check` / `lint:css:check` check without
fixes; existing fixing scripts remain available.

TypeScript extends the common library profile. Jest stays local; `make` builds and increments the core version.
