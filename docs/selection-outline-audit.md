# VisualSelectionOutline geometry audit

Baseline: core main `2b68f2d` (merged #50). The audit fixture mounts only the actual
outline, StoryRegionsProvider and BookApplicationSurface. It contains no Embla,
Video or visual renderers, and records both page exceptions and window error
messages. None of its four passing scenarios emits a ResizeObserver loop warning.

## Reproduced defects

On unchanged main, three of four browser tests fail:

1. Shrinking narrativeViewport from 260 to 140 pixels leaves a 260-pixel outline
   when selected narrativeContent and application dimensions remain unchanged.
   The fixture changes the clipping DOM box directly, without a React model update.
2. An initial `transform: scale(0.75)` on the embed makes the outline apply scale
   twice. For example, its x was 136.875 instead of 142.5.
3. A new selected-item snapshot accompanying a same-size region move leaves
   the previous outline position and border radius.

Preview resize, native scrolling and selected region changes already worked on
main and remain covered.

## Minimal fixes

The existing ResizeObserver remains. It observes the selected region and root,
and now also narrativeViewport when clipping narrativeContent. DOM boxes are
necessary because the outline is rendered in a separate selection portal and
must intersect the selected region with its scroll viewport. CSS alone cannot
reference that rectangle and its intersection across these DOM branches.

Viewport/client rectangles include an axis-aligned ancestor scale. Their deltas
and dimensions are converted to root-local CSS units before positioning the
portal child; the root border offset is accounted for. The editor currently has
no preview zoom UI, but BookApplicationSurface accepts ordinary embed styles.
The scaled fixture tests that native embedding boundary without adding a zoom API.
Rotation, skew and perspective of the entire embedding root are not converted
into a general coordinate system.

A changed selected-item snapshot remeasures position and radius through the
existing layout effect. ResizeObserver still handles independent layout changes,
and the existing scroll/resize listeners remain. There is no persistent animation
frame: scheduled measurements coalesce into one pending frame and are cancelled
on cleanup. StrictMode and observer cleanup are exercised by the fixture.

## Feedback and observation limits

Outline styles affect only an absolute, inert portal child. Neither selected
region nor root/clip dimensions depend on those styles, so there is no geometry
feedback path from outline state back into its observed boxes. ResizeObserver
callbacks schedule the existing animation frame rather than changing layout in
the observer delivery callback.

ResizeObserver does not detect position-only DOM/style mutations or a radius-only
CSS change. Scroll/resize and new model snapshots cover the supported updates;
arbitrary external CSS mutations with no model update or observed layout event
remain outside that notification contract. Radius refreshes on these same events.
MutationObserver, polling, a permanent requestAnimationFrame loop and a general
transform engine were rejected as disproportionate. No warnings from other
components are attributed to this outline or filtered in production.

## Verification

`selectionOutline.browser.test.js` checks independent clip resize, preview resize,
real scroll, selected region changes, initial scaled embedding, and a model update
with changed position/radius but unchanged sizes. The complete fixture passes
against the fix; the unchanged-main run preserves the three reproductions above.
