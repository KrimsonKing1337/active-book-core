# Carousel selection and slide activity

`Carousel` remains a standalone, non-looping Embla carousel. It accepts
`slides: readonly ReactNode[]` and an optional `onSelect(index: number)` callback.
Both `Carousel` and `useCarouselSlideActive` are exported from the public
`components` barrel.

## Selection notifications

The index is zero-based and comes from Embla's selected scroll snap. React state
is a rendering snapshot, not a second selection controller.

- A nonempty carousel reports its initial selection after Embla initializes.
- Buttons, arrow keys and dragging report each changed selected index.
- `reInit` refreshes navigation and reports selection only if the index changed.
- Ordinary rerenders, new arrays with the same slides, resize and replacement of
  the callback do not replay an unchanged index.
- The next notification uses the latest committed callback.
- Empty carousels render nothing and report no selection. Populating an empty
  carousel creates a fresh Embla instance and reports its initial selection.

The last reported index is remembered only to deduplicate notifications,
including StrictMode effect replay. There is no controlled index, external Embla
API, Redux state or stored reader progress.

## Local activity

`useCarouselSlideActive(): boolean` reads a provider around the current slide's
content. It returns `true` only for that carousel's selected slide, and `true`
outside a carousel. Activity is supplied during React rendering; it does not
query the DOM or mount/unmount content when selection changes.

This signal does not implement media playback or Dialog presentation. Inert and
`aria-hidden` still protect inactive slides from focus and accessibility
navigation; neither attribute pauses media.

## Slide changes and identity

Embla preserves the numeric scroll-snap position on reinitialization, clamping it
when slides are removed. Selection does not follow a logical slide identifier.
For example, reordering content at index 1 can change which slide is active while
the selected index and notification history remain unchanged.

Unique explicit React element keys are reused for slide wrappers, preserving
child state across keyed reorders. Unkeyed React nodes use positional wrapper
keys. No identifiers are inferred from node contents or DOM attributes.

The book runtime currently creates slide fragments with positional keys. It
therefore cannot guarantee logical slide identity across document reorders.
Changing the book format or runtime renderer is outside this stage.

## Input isolation

ArrowLeft/ArrowRight navigate when the carousel region itself has focus.
Descendant keyboard events keep their native behavior. Dragging ignores links,
buttons, form fields, editable content and native `video[controls]` elements.
Dragging on a video without controls remains available.

The `data-book-carousel` marker keeps Narrative's reader navigation separate
from carousel input, including swipes at the last slide.

The implementation uses Embla 8.6.0. References for that major version:

- [Events](https://www.embla-carousel.com/docs/v8/api/events): `select`, `reInit`, listener cleanup.
- [Methods](https://www.embla-carousel.com/docs/v8/api/methods): `selectedScrollSnap`.
- [Options](https://www.embla-carousel.com/docs/v8/api/options): `watchDrag`, `watchResize`, `watchSlides`.
