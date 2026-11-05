# Эксперимент: постоянный DOM произведения

Ветка `experiment/persistent-story-viewport`, база `experiment/visual-effects-playground`.
Эксперимент не предназначен для немедленного merge в main.

## Жизненный цикл

```text
AppWrapper (bookKey, либо config.id)
  BookSession / VisualEffects / ссылка на настоящий NarrativeFrame
    AppContent
      StoryVisualRoot / существующие VisualSurfaces, геометрия, CSS mirror
        PageWrapper
          StoryViewport (настоящий MainContent, LayoutLease)
            NarrativeFrame / локальные эффекты
              Narrative (постоянный scroll-container)
                PageContent key=pageId / Suspense
                  выбранные текст, компоненты, аудио, вибрация, фонарик
            Toolbar / настройки / оглавление / закладки
```

`storyPages: readonly { id: string; content: ReactNode }[]` — таблица содержимого, а не маршрутов.
`children` AppWrapper — содержимое Page0. Компоненты страниц больше не содержат PageWrapper.
В Redux находятся `pageId: string | null` и упорядоченные `pageIds`; null означает Page0.
`mainSelectors.page` вычисляет позицию для существующих диапазонов, закладок и Toolbar.
`useGoToPage().goToPage(id)` выбирает стабильный ID; числовой аргумент выбирает текущую позицию.
Next/Prev используют порядок таблицы. Неизвестный ID/номер игнорируется, URL и history не меняются.
Перестановка страниц сохраняет выбранный ID. При удалении текущего ID ядро выбирает первый оставшийся;
редактор явно выбирает ближайшую страницу своим существующим действием удаления.

Оболочка не имеет ключа страницы. Ключ есть только у PageContent: старые React-компоненты размонтируются,
их эффекты очищаются, segments сбрасываются, новое содержимое монтируется. Suspense ограничен содержимым:
ожидание ленивого компонента не скрывает всю оболочку и эффекты. Владельцы ресурсов сохраняют свои cleanup.
Это не ручной реестр аудио, таймеров и других ресурсов.

Narrative обнуляет scrollTop в layout effect при смене pageId. Если фокус исчез вместе с контентом,
reader передаёт его Narrative; фокус постоянного Toolbar остаётся на месте. Editor не получает
автоматический фокус от ядра. Keyboard control игнорирует текстовые поля, модификаторы и открытые окна.
Page0 сохраняет обработчики пользовательского жеста и разблокировки аудио; её тело находится в той же оболочке.
Смена bookKey/config.id размонтирует оболочку. Внешняя visual session принадлежит вызывающему коду:
снятие host очищает renderers, а уничтожение самой внешней сессии остаётся у её владельца.

## Непрерывный шарик

```sh
npm install
npm run dev:visual-lab
# http://localhost:4175/tests/visualPlayground/
# выбрать «09 · Непрерывный шарик»
```

Большой бирюзовый шарик имеет lifetime `[{from:1,to:2},{from:4,to:4}]`, маленький золотой — страницу 1.
Переходы 1 → 2 → 4 сохраняют настоящий DOM-узел большого шарика и тот же Animation object.
Текст четырёх глав различается. 4 → 3 вызывает cancel и unmount; 3 → 1 создаёт новый экземпляр.
Диагностика показывает token, номер монтирования, страницу и состояние анимации.
Анимация запускается автоматически, длится 20 секунд на проход, бесконечно меняет направление.
Общие команды ручного playback для этого автоматического примера скрыты.

Renderer использует существующий registry и range activation; `createPortal` направляет его в настоящий
постоянный NarrativeFrame, доступный через `useNarrativeFrame`. Его локальная поверхность имеет `inset:0`,
проценты координат и собственное clipping. CSS mirror и геометрия не участвуют в размещении шарика.
Нет сохранения/восстановления currentTime, положения, Canvas-state или отдельного animation store.
WeakMap в лаборатории считает фактические смонтированные DOM-узлы для диагностики StrictMode;
она не содержит состояния анимации.

## Окна и browser history

Из AppContent, Redux watchers, Menu и Bookmarks убраны безусловные pushState и popstate-ловушки.
Небольшой `useWindowHistory` синхронизирует существующее состояние окна с одной записью History API:
открытие — push, смена окна — replace, Back — закрытие, Forward — повторное открытие.
X/Escape делают запись неактивной и потребляют её через Back; Forward после явного закрытия
не открывает окно снова. Следующий Back работает как обычная навигация браузера.
URL не меняется, чужие поля history.state сохраняются. Перезагрузка принимает существующую запись,
StrictMode replay её не потребляет. Реальный unmount закрывает принадлежащую книге запись.
Настройки, оглавление и закладки используют прежние Redux slices, без отдельного менеджера окон.
Медиа и информационные Modal используют тот же адаптер; controlled владельцы передают onOpen/onCancel.
Таймеры ModalDialog стали локальными для экземпляра вместо общих переменных модуля.

History API асинхронен. Закрытую запись нельзя физически вырезать из Forward-ветки браузера:
она остаётся инертной; новое открытие отсекает эту ветку обычным pushState. Это явный предел API.
Переключение окон не наращивает цепочку. Произвольные вложенные окна с нескольких независимых
владельцев не являются новым поддерживаемым сценарием; обычные окна книги взаимоисключающие.

## Editor и reader

Runtime создаёт таблицу из настоящих ID BuiltBookDocument и передаёт BookPage как содержимое.
Page0 передаётся отдельно как стартовое содержимое. В редакторе useBookPages публикует ID при
добавлении, удалении, перемещении и замене книги; VisualBookPreview держит общую оболочку.
TipTap меняет документ своим существующим механизмом, сохраняет flushStyles/capture/autosave,
AudioInstances остаётся page-owned. EditorContent более не обёрнут PageWrapper с ключом страницы.

Удалены Routes.tsx с динамическими page-маршрутами, MemoryRouter/Route/Routes и useNavigate/useLocation
из ядра, runtime, editor preview и browser fixtures. Удалены зависимости ядра react-router,
react-router-dom, @types/react-router-dom; из editor/runtime удалён react-router-dom.
Других полезных маршрутов в этих пакетах не обнаружено. Нового router или fallback на старую схему нет.

## Оценка

**А. Настоящие локальные регионы.** Да: шарик размещён в реальном NarrativeFrame без зеркала.
Это не доказывает, что внешние эффекты, произвольные маски и пересечения регионов можно удалить:
геометрия, CSS mirror и LayoutLease намеренно сохранены.

**Б. Восстановление range-анимаций.** В пределах непрерывной активации не нужно: React, DOM и WAAPI
сохраняют identity. После выхода из range и после уничтожения книги это новая активация с новой фазой.
Смена Renderer, portal target или ключа по-прежнему означает новый экземпляр.

**В. Простота навигации.** Выбор страницы стал одной Redux-операцией по ID; нет URL/path, matching,
маршрутов и route cache. Таблица содержимого и две операции next/prev существенно меньше Router.
Обязанности scroll/focus/page cleanup теперь явные. Самая сложная часть — History API окон;
её нельзя приписывать выбору страниц, и от неё не избавлял прежний MemoryRouter.

**Г. Оставшиеся проблемы.** Нужны проверки на физических iOS/Android для audio unlock, camera/flashlight,
swipe и системного жеста Back; Chromium не проверяет эти устройства. Типы page/range и старые закладки
по-прежнему позиционные, полноценное изменение этой модели здесь не выполнялось. TipTap обновляет документ
через microtask из-за React node views; фокус ядро не перехватывает, но этот существующий порядок остаётся.
Локальный portal обходит поверхности геометрического clipping/depth: для него действует stacking настоящего
региона. Это намеренный локальный пример, не универсальный placement backend для всех эффектов.

**Д. Основная ветка.** Подход стоит развивать: преимущества identity подтверждаются на настоящих узлах
и существующих видео. Переносить отдельным изменением после review API storyPages и ручной проверки устройств.
Не совмещать с удалением геометрии или заменой всех эффектов на CSS. Эти Draft PR не мержатся.

## Проверки

Ядро пересобрано и установлено в editor как `0.0.47` через `npm run core:package`.
Проверены исходники и фактически установленный архив, без source alias вместо зависимости.

- Core: TypeScript source/fixtures; 53 Jest-теста; 42 browser-проверки полного набора и 5/5
  финального persistentStory-набора после добавления ещё одного сценария (итого 43 отдельных browser-проверки);
  8 проверок scssAlias. ESLint затронутых source/fixtures и Stylelint нового SCSS — без ошибок.
- Editor: TypeScript всех workspaces и тестов; 64 unit, 4 component, 12 browser; production build editor.
- Сквозной editor → TipTap → сохранение → перестановка/добавление/удаление страниц → сборка → reader — прошёл.
  Проверяются настоящие узлы StoryViewport, Narrative, Toolbar, range-видео/изображений и URL.
- Browser Back: реальные настройки → оглавление → закладки, навигация по пунктам, Back/Forward,
  явное закрытие, Escape, информационная Modal, reload, новая вкладка и unmount книги.
- Существующие Linux screenshots сверены с прежними эталонами; эталоны не менялись.
- Сохранились предупреждения ESLint о длине крупных файлов/старых зависимостях hooks и Vite о размере chunk.
  Ошибок проверок и browser pageerror нет. Ручных проверок физических устройств не было.

Основные команды:

```sh
npm run typecheck
npm run typecheck:test
npx jest --runInBand
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
npm run test:scss-alias
# в соседнем activeBook-editor:
npm run core:package
npm run typecheck
npm run test:unit
npm run test:component
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
npm run build:editor
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:runtime
```
