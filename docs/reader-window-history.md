# Reader windows: one Redux state and Browser History adapter

This stage builds on merged PR #44 (`52878d6`). The page-resolution race is fixed
first in `ebe5f88`, with a regression that explicitly renders main/page B while
windows still belongs to page A, without running BookSession's synchronization
effect. Neither this intermediate state nor an obsolete session invokes the
content resolver.

## State and shells

`windows.activeWindow` is the only opening state. Its `kind` selects a concrete
shell: `content`, `menu`, `tableOfContents`, `bookmarks`, or `legacy`. The existing
content-opening API defaults to `content`. All kinds belong to the current
reader session and actual page; navigation clears them, including locked windows.
The host resolves only `content` and validates both owner and page first.

Menu, TableOfContents and Bookmarks retain their specialized Overflow layout.
Their close commands capture an instance target. Overflow retains Escape,
scrolling focus and return focus, and does not restore old panel focus during
replacement. Bookmark data and persistence remain in the bookmarks slice.
AchievementsProgress has no implemented panel; the obsolete discriminator and
commented opening code have been removed.

The remaining real Modal consumers also open descriptors through
`useReaderWindow`: WithModal, the camera notice on Page0, WelcomeTour's notice,
and Nav's swipe notice. They keep their old rendering and gesture code. The
WithModal video effect is unchanged. Modal no longer owns a History hook.
ModalDialog's existing countdown unlocks the exact window instance; permission
updates for replaced instances are ignored. The camera confirmation uses
identity-bound `forceClose`, since this notice intentionally disables user
cancellation even after its confirmation button becomes available.

No book data, package dependencies, authoring contracts, localStorage preferences,
Embla, Video components, Popover or VisualEffects Session were changed. No types
or editor repository change is needed for this internal Redux contract.

## History protocol

BookSession connects one adapter in reader mode. Editor mode does not connect it
and reader-panel opening commands are inert in preview. There are no per-panel
History subscriptions. The implementation separates validation (`history/utils`),
entry writes (`entries`), native traversal/listener ownership (`navigation`),
Redux reconciliation (`connect`), and React attachment (`history/hooks`). Each
production history/hook module is below the 150-line limit, excluding blanks/comments.

`history.state.activeBookWindows` contains only:

```ts
{ version: 1, sessionId, pairId, position: 'base' | 'guard' }
```

There is no window identity, content, kind or restoration command in History.
Other history.state fields are copied unchanged into both entries. Opening adds
one Guard over the current entry, which is marked Base without changing its URL.
Replacement reuses Guard. Opening from Base replaces the old forward branch;
opening on an inert own Guard can reuse that Guard.

| Operation | Redux | Browser History |
| --- | --- | --- |
| Open A, replace with B/C | One current instance | One Guard; replacement does not push |
| Back to own Base, closable window | Request close for current target | Remain on Base |
| Forward after closing | Remain closed | Guard remains inert, including unrelated Redux traffic |
| Button / Escape / force close | Close matching target | Consume own Guard with Back |
| Back to own Base, locked window | Remain open | Request `go(1)` to the known Guard; never push for rejection |
| Programmatic replacement of locked window | Replace atomically | Reuse current Guard |
| Page change | Clear page-owned descriptor | Consume its Guard if still connected |
| Reload / new bookKey / unmount | No inherited open window | Never reconstruct a window from markers |

The adapter remembers the previous descriptor identity only to detect Redux
transitions. This is protocol bookkeeping, not another UI opening state. An
internal closing Back is allowed to complete before arming a successor. Its
completion reconciles the latest Redux descriptor and never closes that new
instance. A host popstate listener may run before the adapter and already push a
successor's Guard: the adapter compares event and current markers and ignores
the stale event. Duplicate positions do not dismiss windows.

Cleanup unsubscribes Redux and disconnects the owner. It never navigates. Only
the transport listener for an outstanding internal closing Back can survive
teardown, until the native event completes; it has no old Redux callback. A
compensating Forward does not retain listeners after teardown. No timers or
microtasks are used by the adapter.

## Actual Browser History limits

`popstate` follows traversal and cannot cancel it. Compensation applies only to
an observed transition inside the adapter's own Base/Guard pair. Jumping over
the pair through the history menu, leaving the document, or competing host
navigation cannot be absolutely blocked with this API. Unknown destinations
are not corrected with a guessed Forward or new pushes.

In the installed Chromium, two immediate native `history.back()` calls can
cancel the compensating `go(1)` without dispatching another popstate. The locked
window remains open but the browser can be on Base. There is no reliable
History API completion/cancellation signal to repair this without guessing or
intercepting the browser. We retain the expected destination for late-event
recognition but allow subsequent explicit window transitions to proceed. They
re-arm normally, without freezing UI or swallowing the successor's Back. We do
not retry on timers, force an automatic navigation loop, or push a Guard for
every rejected Back. Tests observe this outcome directly and separately prove
that native `go(-2)` can leave the document with a locked window.

Unmount leaves any unconsumed marker inert; cleanup does not navigate an
embedding application's history. The host must not overwrite/copy this reserved
marker as if it owned the pair. Other host fields are preserved. The existing
singleton Redux store supports one active reader owner; simultaneous independent
readers are outside this stage.

## Removed mechanisms and remaining legacy consumers

Removed completely:

- `useWindowHistory` (including its restoration-on-Forward behavior).
- StoryShell's `useBookWindows`, scope prop and scope construction.
- `main.menuActiveState`, its action, selector and unused achievements variant.
- `bookmarks.isOpen`, its action and selector; bookmark data stays.
- Both cross-closing sagas and Overflow's direct main/bookmarks dispatches.
- Per-Modal history subscription and unused onOpen restoration callbacks.
- Local opening flags for WithModal, Page0 notices and Nav's swipe notice.

Old presentation still in use:

- `ColoredTextTrigger/WithModal` → Modal.
- Page0 camera notice → ModalDialog → Modal.
- WelcomeTour notice → ModalDialog → Modal.
- Toolbar/Nav swipe notice → ModalDialog → Modal.

Hammer is still used by the old Modal and Narrative and remains a dependency.
Those shells can migrate separately to StoryDialog after their specialized UI
and media behavior are specified. A subsequent authoring stage can connect new
Dialog nodes and resolvers; this change introduces neither a registry nor book
format compatibility/migrations.

## Validation

The final validation results and changed-file manifest follow below. Existing tests that expected restoration after Forward/reload were
updated deliberately: Redux now remains closed on both paths. Page selection
already consumes the window's Guard, so panel navigation tests no longer issue
an extra Back after changing the story page.

The visual-plane regression keeps editor-only vibration preview assertions in
editor mode and checks reader menu interaction in its own reader scenario. The
Toolbar wrapping/control scenario also explicitly uses reader mode. Preview
checks verify that these controls do not claim a reader window or write History.

## Final check record

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run typecheck:test` | Passed |
| `npm run test:unit` | 21 suites, 89 tests passed |
| `npm run lint:css:check` | Passed |
| `npm run test:scss-alias` | 8 tests passed |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser` | 79 tests passed |
| Focused native History rerun after extracting the listener-retention predicate | 8 tests passed |
| ESLint on all changed TS/TSX and new modules | 0 errors; 6 existing warnings |
| `npm run lint:ts:check` | 91 errors and 47 warnings in the complete repository |

The remaining ESLint errors are in untouched code. The six warnings on changed
files are existing hook dependencies/long files in AppContent, Modal and Page0;
the new history and hook modules have no ESLint errors or warnings. No lint rules
were disabled. Generated screenshots from the broad browser run are restored
and excluded from the PR.

## Changed files

Relative to merged PR #44 on main. R denotes the split/relocation of the original
hooks module; generated browser screenshots are not part of the change.

```text
A	docs/reader-window-history.md
M	docs/story-window-state.md
M	scripts/persistentStory.browser.test.js
M	scripts/runBrowserTests.js
M	scripts/storyRegions.browser.test.js
M	scripts/storyWindows.browser.test.js
M	scripts/visualPlacement.browser.test.js
A	scripts/windowHistory.browser.test.js
M	src/components/AppWrapper/components/AppContent/AppContent.tsx
M	src/components/Bookmarks/Bookmarks.tsx
M	src/components/ColoredTextTrigger/WithModal/WithModal.tsx
M	src/components/Menu/Menu.tsx
M	src/components/Menu/components/Footer/Footer.tsx
M	src/components/Modal/Modal.tsx
M	src/components/ModalDialog/ModalDialog.tsx
M	src/components/Overflow/Overflow.tsx
M	src/components/StoryShell/StoryShell.tsx
D	src/components/StoryShell/hooks.ts
A	src/components/StoryWindowHost/StoryWindowHost.test.tsx
M	src/components/StoryWindowHost/StoryWindowHost.tsx
A	src/components/StoryWindowHost/history/@types.ts
A	src/components/StoryWindowHost/history/connect.ts
A	src/components/StoryWindowHost/history/entries.ts
A	src/components/StoryWindowHost/history/hooks.ts
A	src/components/StoryWindowHost/history/index.ts
A	src/components/StoryWindowHost/history/navigation.ts
A	src/components/StoryWindowHost/history/utils.test.ts
A	src/components/StoryWindowHost/history/utils.ts
A	src/components/StoryWindowHost/hooks/index.ts
A	src/components/StoryWindowHost/hooks/useReaderWindow.ts
R054	src/components/StoryWindowHost/hooks.ts	src/components/StoryWindowHost/hooks/useStoryWindowActions.ts
A	src/components/StoryWindowHost/hooks/useStoryWindowSession.ts
M	src/components/TableOfContents/TableOfContents.tsx
M	src/components/Toolbar/Toolbar.tsx
M	src/components/Toolbar/components/Nav/Nav.tsx
M	src/components/Toolbar/components/Nav/components/Modal/Modal.tsx
M	src/components/WelcomeTour/WelcomeTour.tsx
M	src/components/WelcomeTour/components/Modal/Modal.tsx
D	src/hooks/control/useWindowHistory.ts
M	src/pages/Page0/Page0.tsx
M	src/pages/Page0/components/Modal/Modal.tsx
M	src/pages/Page0/hooks.ts
M	src/store/bookmarks/@types.ts
M	src/store/bookmarks/selectors.ts
M	src/store/bookmarks/slice.ts
M	src/store/bookmarks/watchers.ts
M	src/store/main/@types.ts
M	src/store/main/selectors.ts
M	src/store/main/slice.ts
M	src/store/main/watchers.ts
M	src/store/windows/@types.ts
M	src/store/windows/index.ts
M	src/store/windows/selectors.ts
M	src/store/windows/slice.test.ts
M	src/store/windows/slice.ts
M	tests/storyWindows/WindowPage.tsx
```
