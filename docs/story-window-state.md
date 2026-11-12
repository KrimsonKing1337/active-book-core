# Story windows: Redux ownership stage

This is the historical ownership-stage report. The current History protocol and
panel migration are documented in [Reader window history](./reader-window-history.md).

The current reader now owns one transient Redux `windows.activeWindow` descriptor.
No window state is written to book data, localStorage or browser history.
The slice uses existing Redux Toolkit; there is no second store or registry.

## State and operations

```ts
type StoryWindow = {
  instanceId: string;
  contentId: string;
  canClose: boolean;
};
```

The enclosing slice stores `sessionId` and `pageId` to validate ownership. The
canonical current page remains `main.pageId`; the window slice remembers the
synchronized owner/page only to reject stale requests. There is no window kind
yet: the only current consumer is StoryDialog. Add a discriminated kind when real
reader panels are converted, rather than reserving unused descriptor variants.
All windows in this new channel currently belong to the synchronized page; panel
lifetimes can be specified when those actual consumers are migrated.

- `synchronizeSession({ sessionId, pageId })`: adopt the reader/page, clearing its
  previous window if either owner or page changed. Repeating the same values is
  a no-op, so invalid/same-page navigation does not dismiss a window.
- `open({ sessionId, pageId, contentId, canClose? })`: atomically replace the active
  descriptor. The action's prepare function creates a fresh `instanceId`, even
  when reopening the same content. The old `canClose` never blocks replacement.
- `requestClose({ sessionId, instanceId })`: close only the matching instance and
  only if it permits user dismissal.
- `forceClose({ sessionId, instanceId })`: close the matching instance regardless
  of `canClose`. A late system callback cannot close a successor either.
- `endSession(sessionId)`: clear the current owner's descriptor and ownership.
  Stale cleanup from a previous session cannot clear a new session.

Mode, fullscreen, object-fit and carousel indices do not enter Redux. React nodes,
component implementations, refs, DOM nodes and library instances are also excluded.

## Reader lifecycle

BookSession creates a fresh window ownership token. A small context carries only
that token to reader descendants; Redux remains the only source of open state.
Layout effects synchronize actual page changes and release ownership on teardown.
There are no timers or delayed synchronization queues. StrictMode cleanup/setup
releases and reconnects the same owner synchronously. A new bookKey creates a new
owner, and an actual unmount cannot leave a window for the next reader.

`useStoryWindowActions` binds commands to that reader and page. Its `open` returns
the new instance ID for callbacks. Old-page opens are rejected after navigation;
old-session opens/closes are rejected after teardown or replacement of the reader.
Editor mode does not claim reader window ownership. The existing singleton Redux
store is retained; this is not a redesign for concurrent independent readers.

## Host integration

Mount one StoryWindowHost inside the reader's BookSession/StoryRegions boundary.
Its required `resolveContent(contentId)` prop resolves content directly from the
owner's model and returns title, children and optional StoryDialog presentation
props. Resolved React content stays outside Redux. No register/unregister API,
global component map or temporary authored Dialog node is introduced.

The real authored-window model is not available yet. Therefore this stage mounts
the host only in `tests/storyWindows`, using a direct fixture resolver and the real
AppWrapper lifecycle. Production panels remain on their existing paths. The
lifecycle boundary is prepared in BookSession for the later production host.

The host uses the actual storyViewport as the portal container, never an inert
visual host. StoryDialog still knows only props and Radix. The shell stays mounted
when A is replaced with B; a fragment keyed by the opening identity resets the
old content's local state. Radix retains one focus scope. Close autofocus is
suppressed if another window/session has taken over. A connected opener receives
focus on final close; if it was removed on page change, the focusable storyViewport
is the fallback. These hooks also protect fast close/reopen and StrictMode replay.

## Preserved paths and next stage

Menu, table of contents, bookmarks, informational windows, Modal, ModalDialog and
WithModal are not migrated in this PR. Their independent flags and existing
useBookWindows/useWindowHistory behavior remain until coordinated conversion.
The one-window invariant currently covers the new channel; no production scenario
mixes it with the legacy channel in this stage.

The following stage should connect one history adapter to the Redux descriptor,
then migrate those panels together: replace their flags with descriptors and
selectors, remove their per-window history hooks, and implement the agreed
Back/Forward/canClose protocol. History will store navigation markers, not React
content or a second source of open state. This PR creates no history entries and
does not implement or mock the future navigation protocol.

Authored nodes, TipTap, book-builder, Embla, Video lifecycle, Popover, Hammer and
VisualEffects Session are unchanged.

## Verification

Slice unit tests cover opening/replacement, repeated content IDs, stale user and
system callbacks, locked windows, page/session changes and serializable state.
The real-browser fixture covers one visible Dialog, replacement state reset,
focus, dismissal versus forced close, page changes, teardown/recreation,
bookKey changes and StrictMode. Existing Dialog and reader history tests remain
regression checks; the new fixture verifies that its commands do not write history.

Validation on 2026-11-12: source/fixture TypeScript, full Stylelint, focused ESLint,
73 unit tests, 8 SCSS-alias tests, 8 Dialog/window browser tests, and the existing
reader history/root browser scenarios pass. Full ESLint still reports 119 errors
and 47 warnings in unchanged files. A baseline run on main reproduced a race in
the old Dialog fixture: programmatic React state changes were followed by input
before the new props committed. The fixture now waits for observable DOM state
without sleeps or weaker assertions.
