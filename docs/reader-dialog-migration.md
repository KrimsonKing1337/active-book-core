# Reader dialogs: legacy shell migration

Based on main `6aa8537`, which includes merged PR #45 and its follow-up refactoring.
All current reader Modal/ModalDialog consumers now use StoryDialog and the
existing Redux window descriptor. No dependency, book-format, builder, editor
or History Adapter change is required.

## Rendering and ownership

The four actual import paths were audited, including component exports and test
fixtures. Local React content remains with its owner:

| Consumer | Rendering | Opening and continuation |
| --- | --- | --- |
| ColoredTextTrigger/WithModal | StoryDialog + DialogMedia | Existing text/author/EasterEgg triggers; Enter/Space activation |
| Page0 camera warning | CameraNotice + StoryConfirmDialog | Five-second confirmation, always mandatory; forceClose then existing initialization |
| WelcomeTour introduction | WelcomeNotice + StoryConfirmDialog | Two-second confirmation, then existing guide/highlight/skip/completion |
| Toolbar/Nav swipe hint | SwipeNotice + StoryConfirmDialog | Two-second confirmation, existing persisted flag; confirmation itself does not advance a page |

Transient `kind: 'dialog'` identifies locally rendered React content. The old
`legacy` kind is gone. `content` still identifies windows resolved by
StoryWindowHost; local media/confirmation descriptors never reach its resolver.
There is no ReactNode, callback or component registry in Redux or a global map.
There are no local opening flags or per-dialog History subscriptions. WithModal's
optional mode now uses BookDialogMode (`default`/`media`); no old `text` alias is retained.

`useStoryWindowDialog` shares the existing viewport, target validation, user
close dispatch and autofocus guard between the host and local compositions.
It verifies session, current page and instance before rendering/performing
business actions. The existing intermediate-page resolver regression still
passes. Replacement never returns old focus while another window is active.
Hidden or unfocusable openers also use the viewport fallback. Body/documentElement are no longer captured as meaningful openers; if a local
replacement removes the focused node, closing uses storyViewport instead.

Removing a local owner closes its exact descriptor. Its cleanup queues one
microtask solely to distinguish actual owner removal from React StrictMode's
synchronous cleanup/setup replay. The mounted ref and reducer identity checks
protect live owners and successors. This is not a History retry or timer-based
synchronization scheme. Real owner removal, page change and StrictMode are tested.

## Confirmation

StoryConfirmDialog composes the universal StoryDialog with confirmation/cancel
buttons. Its countdown is local and tagged with instanceId and duration. One
cancellable timeout updates from a deadline rather than decrementing an interval
counter. Reopening creates a new deadline; obsolete queued ticks cannot unlock
a successor. Zero delay is immediately ready, without a timeout.

Confirmation producers open locked (`canClose: false`) before their renderer commits.
Redux canClose is then synchronized in a layout effect with actual user-dismissal
eligibility. Page0 explicitly sets allowDismiss=false even after its button is
ready. Escape, outside dismissal and Back remain rejected; confirmation uses
the existing identity-bound forceClose. Other notices become user-dismissible
after their delay. Before invoking a confirmation callback, the composition
rechecks the latest Redux identity and page, so an old eligible callback cannot
navigate or close a successor indirectly through business effects.

The shared Button now forwards its existing disabled prop to the native button.
Previously that prop only changed a CSS class. Native disabled semantics are
necessary for keyboard navigation and confirmation availability. Page0's read
action now supports keyboard activation through its ordinary click path, keeping
the existing audio-unlock capture listener and initialization order intact.
These changes provide native keyboard and disabled semantics without replacing the initialization flow.

StoryDialog remains independent of confirmation timers and Redux. Optional
Description is linked only when present; notice copy uses Title/Description,
and camera paragraphs retain their line breaks.

## Media lifecycle and controls

Closed WithModal content is absent from the portal DOM. DialogMedia captures only
videos below its own rendered body, starts them while its exact window is still
current, and pauses/resets those captured elements on close, replacement or
owner removal. There are no global video queries in this path. Reopening starts
at zero, preserving the former WithModal position policy. A denied autoplay
request exposes native controls; aborted/obsolete play requests do not affect a
successor.

Video's normal page behavior is unchanged. A stateless scoped VideoPlaybackContext
marks dialog media so it does not restore/cache page playback time or opt into
AppContent's page autoplay pass. This small Video change is required because
Radix remounts portal children: the old page-time restoration would otherwise
undo the reset on reopening. The existing page-volume/position/StrictMode test
and new scoped-policy test pass; Chromium verifies real playback and reset.
There is no carousel/Embla or selected-slide integration in this stage.

Fullscreen and contain/cover use StoryDialog's existing reader preferences and
CSS variable. Media CSS also reaches core Video inside its local wrapper. There
are no separate legacy crop/fullscreen states. Explicit fullscreen/fit buttons
replace the old double-tap/pinch shortcuts; their real touch interaction is
verified at a mobile viewport. No new gesture library or global listener is added.

Preview continues to leave reader window ownership and History alone, as in
PR #45. Standalone controlled StoryDialog preview controls still work without
writing reader preferences. New authoring/preview content resolution remains a
separate stage.

## Removed code and remaining scope

Deleted:

- `src/components/Modal/` and `src/components/ModalDialog/`, including SCSS and exports.
- All three old local `components/Modal/` wrappers, replaced by named notice compositions.
- Legacy fullscreen/crop/Hammer handlers and props belonging to those shells.
- `useModal`/setter-shaped Page0 plumbing, `useReaderWindow.setIsOpen` and `kind: 'legacy'`.

WithModal remains a supported trigger/content composition; it no longer uses the
old Modal. There are no remaining production consumers of either deleted shell.
Hammer remains in package.json because Narrative, SlideShow and SlideShowOnClass
still import it. Those implementations, VisualEffects Session and page navigation
are unchanged. The existing History API limits documented for PR #45 also remain.

## Validation

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run typecheck:test` | Passed |
| `npm run test:unit` | 23 suites, 98 tests passed |
| `npm run lint:css:check` | Passed |
| `npm run test:scss-alias` | 8 tests passed |
| Chromium `npm run test:browser` | All 88 tests passed |
| Final dialog/host/notice rerun | All 17 passed after keyboard/audio and hidden-trigger focus refinements; includes mobile Page0 |
| ESLint changed TS/TSX and fixtures | 0 errors; one existing Page0 effect-dependency warning |
| Repository-wide `npm run lint:ts:check` | 86 pre-existing errors and 45 warnings |

The new native browser cases cover real user triggers and keyboard focus, A/B
replacement, owner removal, Back/Forward, denied dismissal, countdown/reopening,
actual camera/tour/swipe flows, video playback/reset, mobile touch controls and
reader/preview preferences. Opening interactions use actual controls rather than
Redux dispatch. Initial persisted settings and read-only diagnostics exist only
in fixtures. Unit tests additionally exercise queued old ticks, stale ready
callbacks, zero delay, StrictMode and the dialog/page video policy boundary.
Generated screenshots from the broad suite are restored rather than committed.

## Changed files

Relative to main `6aa8537`:

```text
A	docs/reader-dialog-migration.md
M	docs/reader-window-history.md
A	scripts/confirmDialogs.browser.test.js
A	scripts/readerDialogs.browser.test.js
A	scripts/readerDialogsFixture.js
A	scripts/readerNotices.browser.test.js
M	scripts/runBrowserTests.js
M	src/components/Button/Button.tsx
M	src/components/ColoredTextTrigger/WithModal/WithModal.module.scss
M	src/components/ColoredTextTrigger/WithModal/WithModal.tsx
A	src/components/ColoredTextTrigger/WithModal/components/DialogMedia.tsx
A	src/components/ColoredTextTrigger/utils.ts
D	src/components/Modal/Modal.module.scss
D	src/components/Modal/Modal.tsx
D	src/components/Modal/index.ts
D	src/components/ModalDialog/ModalDialog.module.scss
D	src/components/ModalDialog/ModalDialog.tsx
D	src/components/ModalDialog/index.ts
A	src/components/StoryConfirmDialog/@types.ts
A	src/components/StoryConfirmDialog/StoryConfirmDialog.module.scss
A	src/components/StoryConfirmDialog/StoryConfirmDialog.tsx
A	src/components/StoryConfirmDialog/hooks.ts
A	src/components/StoryConfirmDialog/index.ts
A	src/components/StoryConfirmDialog/tests/confirmation.test.tsx
A	src/components/StoryConfirmDialog/tests/countdown.test.tsx
M	src/components/StoryDialog/StoryDialog.module.scss
M	src/components/StoryDialog/StoryDialog.tsx
M	src/components/StoryDialog/hooks.ts
M	src/components/StoryWindowHost/StoryWindowHost.tsx
M	src/components/StoryWindowHost/hooks/index.ts
M	src/components/StoryWindowHost/hooks/useReaderWindow.ts
A	src/components/StoryWindowHost/hooks/useStoryWindowDialog.ts
A	src/components/StoryWindowHost/utils.ts
M	src/components/Toolbar/components/Nav/Nav.tsx
D	src/components/Toolbar/components/Nav/components/Modal/Modal.tsx
D	src/components/Toolbar/components/Nav/components/Modal/index.ts
A	src/components/Toolbar/components/Nav/components/SwipeNotice.tsx
M	src/components/Toolbar/components/Nav/components/index.ts
M	src/components/Video/Video.test.tsx
M	src/components/Video/Video.tsx
A	src/components/Video/context.ts
M	src/components/WelcomeTour/WelcomeTour.tsx
D	src/components/WelcomeTour/components/Modal/Modal.tsx
D	src/components/WelcomeTour/components/Modal/index.ts
A	src/components/WelcomeTour/components/WelcomeNotice.tsx
M	src/components/WelcomeTour/components/index.ts
M	src/components/index.ts
M	src/pages/Page0/Page0.tsx
A	src/pages/Page0/components/CameraNotice.tsx
D	src/pages/Page0/components/Modal/Modal.tsx
D	src/pages/Page0/components/Modal/index.ts
M	src/pages/Page0/components/index.ts
M	src/pages/Page0/hooks.ts
M	src/store/windows/@types.ts
A	tests/readerDialogs/ConfirmCases.tsx
A	tests/readerDialogs/Content.tsx
A	tests/readerDialogs/Fixture.tsx
A	tests/readerDialogs/index.html
A	tests/readerDialogs/main.tsx
M	tests/tsconfig.json
```
