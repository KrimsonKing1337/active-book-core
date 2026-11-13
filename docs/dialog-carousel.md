# Carousel presentation in StoryDialog

`StoryDialog` remains a generic Radix shell. It receives `mode` and owns numeric,
container-relative width/height, fullscreen and the reader's contain/cover preference.
It does not import Embla, Carousel or slide activity contexts.

## Model-aware composition

`StoryWindowHost.resolveContent` supports two mutually exclusive content forms:

- `children` and optional explicit `mode` for opaque React content;
- `nodes` and `render(onSelect)` for content with a structural model.

`DialogContentNode` is the classifier's readonly projection (`type`, `content`),
not a new book.json schema. The resolver supplies an immutable structural snapshot
for the lifetime of a window instance. It must render the same slide ordering as
that model, and connect its single Carousel to the supplied callback:

```tsx
return {
  title: 'Gallery',
  width: 80,
  height: 80,
  nodes,
  render: (onSelect) => (
    <Carousel layout="fill" slides={slides} onSelect={onSelect} />
  ),
};
```

Host computes the initial `getDialogMode(nodes)` synchronously and then derives
`getDialogMode(nodes, index)` from Carousel's existing `onSelect(index)` notification.
It stores only the resulting mode, associated with the current `instanceId`.
Embla remains the only selection owner. No index or Embla API is stored in Host or
Redux. Delayed callbacks from retired instances cannot affect the current window.
Ordinary resolver rerenders do not overwrite the active slide's derived mode.
Replacing the model of an already open window is outside this snapshot contract;
open a new content instance for structurally different content.

An image or video alone is media; a single carousel delegates to its active slide.
Text, mixed content, unknown components, invalid indices and nested carousels use
`default`. Classification never inspects JSX or DOM tags. `WithModal` continues
to accept arbitrary React children with an explicit mode.

## Bounded layout and playback

`Carousel` defaults to `layout="flow"`, preserving ordinary page flow and spacing.
`layout="fill"` opts into a bounded parent height. In a Dialog, the chain is body →
shared `DialogMedia` → Carousel → viewport → slides. Flex and zero minimum sizes
reserve space for the navigation footer; the active slide scrolls vertically.
The default Dialog body retains its padding, while media mode removes it through
the existing CSS transition.

The semantic body attribute `data-story-dialog-body="media"` enables sizing of
**direct image/video children of a fill slide**. Their boxes fill the slide and use
`--story-dialog-object-fit`. The same rule applies to standalone direct media in
`DialogMedia`. Arbitrary wrappers/custom components are responsible for their own
layout. In default mode, media retains natural sizing (with a width constraint in
fill slides), and object-fit is not forced onto mixed content.

`DialogMedia` is shared by WithModal and model-aware Host content. Its existing
playback ownership and final-close cleanup are unchanged. Mode, object-fit and
fullscreen change props/styles, without keys or conditional replacement of the
shell, Carousel or Video. Video's existing activity contract handles pausing and
position preservation between slides. No playback policy or time cache changes
are introduced here.

Carousel recovers focus to its existing region before an outgoing focused slide
becomes inert. If changing presentation removes a focused fit button, StoryDialog
moves focus to its existing fullscreen button. Neither behavior requires a global
focus manager or changes to History.

## Integration boundary

The current authoring schema has paragraph, heading, coreComponent and carousel
nodes; it has no standalone image/video nodes. book-runtime renders that schema
and cannot yet provide meaningful media projections to Host. No schema, runtime,
TipTap, builder or editor dependency changes are included in this stage.

Production consumers can opt into the new resolver contract when they actually
own a structural model. Existing explicit-mode WithModal content continues to work.
Automatic image/video gallery presentation is exercised by the real composition
in `tests/dialogCarousel`, including Core Video, but is **not yet wired to authored
reader media**. That requires the future media-node schema and its runtime renderer.
The preview fixture uses the generic shell and the same model composition inside
a 540 × 430 story container; it does not add reader windows to editor preview.

## Verification

Unit/component tests cover classification, mode updates, window identity, local
Carousel state, stale notifications, explicit JSX and local focus recovery.
The three `dialogCarousel*.browser.test.js` suites use real Chromium/Embla/Radix:

- image → Video → mixed/text presentation, contain/cover and screenshot pixel checks;
- body/media dimensions, vertical scrolling, native controls and ordinary page flow;
- unchanged Dialog/Carousel/Video DOM nodes and Redux window/History snapshot;
- native manual pause and position across fit, fullscreen, resize and slide return;
- mouse, keyboard and touch navigation, inert focus recovery, toolbar removal and close focus;
- container-relative preview fullscreen and isolation from reader preferences.

Run through `npm run test:browser`, or invoke those scripts with `node --test`.
Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when using a system Chromium.
