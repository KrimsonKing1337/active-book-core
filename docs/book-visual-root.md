# Persistent book visual root

Current Background/Frame registration, rendering and cleanup supersede the legacy
paths described in this stage; see [stage 5](unified-background-frame.md).

`AppWrapper` is mounted above routing in both `App` (including editor preview) and
the built reader. It now owns one `BookVisualRoot`, which remains mounted while
routes and loading states replace or hide page content. The root occupies the
existing player area, including its outer page spacing and book controls. It does
not use `document.body`, the application's mount node, or editor UI as its surface.

```text
AppWrapper
├─ BookVisualRoot                         persistent, positioned book surface
│  └─ Routes / Suspense                   current route
│     └─ PageWrapper                      existing page-owned structure
│        └─ MainContent
│           ├─ NarrativeFrame             page + outer frame rectangle
│           │  ├─ Narrative               scroll viewport
│           │  │  └─ Narrative__Text       scrolling content
│           │  └─ FrameEffects            behind / above / system overlay
│           ├─ BackgroundEffects
│           ├─ Toolbar
│           ├─ Menu
│           ├─ TableOfContents
│           └─ Bookmarks
└─ editorTools                            optional editor-owned UI, outside book
```

Controls are included in `book` geometry and excluded from `page` geometry without
being reparented. Stage 3 adds root-owned placement surfaces and an isolated,
clipped book boundary. Page/frame stacking contexts release their layers into that
root; see [visual placement](visual-placement.md) for the complete painting order.
The page overflow rules, loader and start-screen audio unlock retain their owners.

## Geometry access

`AppWrapper` accepts a React 19 `ref` to its book root. Pass that ref to
`useBookGeometry(bookRef)` for reactive measurements, or call
`getBookGeometry(bookElement)` when an on-demand snapshot is sufficient.
These are host geometry APIs, not DOM access granted to effect renderers.

`BookGeometry.regions` uses the shared `VisualRegion` type from `@active-book/types`,
which is a type-only peer supplied by the host and a local development dependency.
Rectangles contain `x`, `y`, `width`, and `height` in CSS pixels relative to the
book root's top-left corner. Missing or `display: none` page regions return `null`;
the persistent `book` rectangle remains available. This is axis-aligned DOM
measurement, not a general coordinate-transform or mask API.

| Region | Measurement |
| --- | --- |
| `book` | The persistent player container, including controls and outer spacing |
| `page` | Existing `NarrativeFrame`, excluding Toolbar and other book controls |
| `frame` | The same outer rectangle as page in the current layout |
| `narrativeViewport` | Narrative's stationary client area, excluding borders and scrollbar |
| `narrativeContent` | Text container's moving origin and full content dimensions |

The content origin changes when Narrative scrolls. Its dimensions can exceed the
viewport. `frameInsets` reads Narrative's computed padding, which already resolves
the existing `--frame-*` variables and responsive `clamp()` values.

No relationship between coordinate selection and visibility is imposed. Existing
Narrative overflow still behaves as before; root-level effect surfaces choose their
own visibility independently.

The hook uses one ResizeObserver for the root and fixed region elements, captured
scroll events, and window resize events. A local child-list MutationObserver detects
region replacement during navigation and reconnects size observation. It does not
register arbitrary DOM targets or observe animation attributes. Measurements are
coalesced into a requested animation frame only when an event requires them; there
is no recurring animation loop. Observers, listeners, and pending frames are released
when the hook unmounts. A ref supplied to the hook must refer to the persistent root.

## Existing effect lifetime

Background/Frame renderers, hooks, Redux slices, and page-unmount cleanup are unchanged.
`PageWrapper` still resets its page-owned segments and visual effect stores when it
unmounts. That cleanup has not moved to `BookVisualRoot`.

Persistence of the root does not establish continuous range animation. Book-owned
registration and page/range activation now use the [stage 4 session](visual-lifecycle.md).
The existing legacy stores still retain their original cleanup.

## Checks

```sh
npm run typecheck
npm run typecheck:test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

The browser fixture uses the current router, navigation hook, Page0 audio-unlock
handler, PageWrapper, controls, and existing effect hooks/renderers. In both modes it
checks the root node's identity through route changes and loading, page replacement,
scroll/content/resize geometry, stacking and pointer behavior, editor UI exclusion,
and removal of the previous page's effects. It does not implement a multi-page editor.
