# Visual placement surfaces (stage 3)

Current Background/Frame registration, rendering and cleanup supersede the legacy
paths described in this stage; see [stage 5](unified-background-frame.md).

Book-owned registration and page/range activation are described in
[visual lifecycle](visual-lifecycle.md).

`BookVisualRoot` accepts a controlled `surfaces` list. `App` and `AppWrapper` forward
it as `visualSurfaces`. A `VisualSurfaceItem` contains `id`, `placement`, `visibility`,
`depth`, and `content: ReactNode`. This is a host rendering input, not an instance
registry or a new book/builder schema. IDs must be unique within the list.

The root measures all regions once through the existing `useBookGeometry`. It only
starts its observer while the list is nonempty. Three persistent author plane
containers share the resulting geometry. Each item has a visibility rectangle and
one inner positioned surface containing its ordinary React element. A page-sized
gradient therefore remains one continuous image across frame and narrative.

## Coordinates

All geometry is relative to the persistent book root. For each axis:

```
size = resolve(placement.size, coordinates.size)
offset = resolve(placement.offset, coordinates.size)
position = anchor.position + anchorFraction * anchor.size
           - originFraction * size + offset
```

`px` is literal CSS pixels; `%` uses the corresponding dimension of
`placement.coordinates`. Anchor/origin use the nine agreed points. Negative
offsets are allowed. `anchor.region` selects the tracked point independently of
the coordinate dimensions. Its root position is already known, so conversion to
local coordinates and back cancels out. To follow scrolling content, anchor to
`narrativeContent`; its geometry moves with scroll. A viewport anchor stays fixed.
Choosing content dimensions with an explicit book anchor does not override that
anchor. None of these choices implicitly clip to a narrative region.

## Visibility and masks

The outer rectangle is the selected visibility region in book coordinates. It
clips overflow; the inner surface is translated relative to that rectangle.
`book` includes controls, `page` excludes them, and viewport/content retain their
existing distinct measured rectangles. Root overflow also limits all painting to
the book, including at rounded page edges when visibility is `book`.

Frame visibility reuses `getFrameMaskImage` and the measured frame insets. Side
masks are unioned, including an empty union for no selected sides. A circle or
polygon is an additional CSS `clip-path`, intersecting that rectangle and, for
frame visibility, the side mask. Mask coordinates refer to the visibility
rectangle. Circle radius percentages use its smaller dimension. Polygon points
may use px or % independently.

Unavailable geometry, absent frame insets, nonfinite placement values, negative
sizes/radii and invalid polygons hide the wrapper with `display: none`; children
remain mounted. No unmasked fallback flashes at the origin.

## Painting order

The book is an isolated stacking context. Intermediate page/frame containers
release their former stacking contexts through root-scoped CSS variables. The
legacy CSS defaults still apply outside this root. Actual layers within a book:

| Layer | z-index |
| --- | ---: |
| Existing background | 0 |
| Existing frame behind | 1 |
| Author scene | 2 |
| Narrative | 3 |
| Existing frame above | 4 |
| Author aboveNarrative | 5 |
| Toolbar | 10 |
| Existing book menu/overflow | 15 |
| Author aboveControls | 20 |
| Existing frame overlay (flashlight/vibration preview) | 30 |

Items sort by numeric `depth.order`, then ascending string `id` using JavaScript
string comparison (no locale-dependent sorting). The resulting rank is the local
z-index, so even extreme order values cannot escape a plane. Author surfaces are
inert and ignore pointer events; decorative content cannot intercept Toolbar.

The existing color inversion filter moves from the page wrapper to the book root.
Otherwise the page filter would trap narrative and controls below author planes.
It now covers book surfaces and controls together; editor tools stay outside.
Existing Background/Frame renderers, hooks, Redux and page cleanup are unchanged.
Only their surrounding CSS layers are integrated into the root ordering.

## Identity and scope

A stable ID and plane preserve the React subtree when placement, size, visibility,
mask, order or measured geometry change. Missing regions hide rather than remove
it. Switching the plane moves an item between React parents and **remounts** its
content. No portal relocation machinery is added solely to avoid that remount.
Removing the item from the controlled list unmounts it normally.

This stage supplies no playback commands, page/range lifetime controller, Redux
registration, migration, editor composition UI, renderer conversion, simulation,
shared canvas or dependency graph. Preservation on fixture page transitions only
shows that the host stays mounted; it does not implement range semantics.

## Verification

Run `npm run typecheck`, `npm run typecheck:test`, relevant Jest suites, ESLint and
Stylelint on changed files. `npm run test:browser` runs root regression scenarios
in reader/editor modes and the placement fixture in Chromium. Set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when using a system browser.

The placement fixture checks all regions, mixed units and cross-region anchors,
scroll movement and independent visibility, every frame side and the empty mask,
circle/polygon painting and intersections, a single uninterrupted gradient,
resize, temporarily missing pages, React identity and actual painted depth.
Screenshot pixel assertions verify plane boundaries, numeric/string ordering, color inversion and
real flashlight/vibration preview above an opaque author surface. A click opens
the real Toolbar settings through a covering decorative surface. Existing root
scenarios still verify old effects and their page cleanup.
