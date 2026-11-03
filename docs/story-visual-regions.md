# Story regions and preview selection

The visual root and geometry API are `StoryVisualRoot`, `StoryGeometry`,
`StoryRegionRect`, `getStoryGeometry` and `useStoryGeometry`. DOM markers are
`data-story-region`. The six regions are:

| Region | Bounds |
| --- | --- |
| `story` | The instance's root container, including its own spacing |
| `storyViewport` | Visible work surface including Toolbar (`MainContent`) |
| `narrativeFrame` | Narrative and frame, excluding Toolbar (`NarrativeFrame`) |
| `frame` | Derived narrativeFrame rectangle plus selected padding bands |
| `narrativeViewport` | Stationary narrative client area |
| `narrativeContent` | Moving content origin and full scrollable dimensions |

`frame` has no extra DOM wrapper. Its side masks still use narrative padding and
narrativeFrame bounds, even when the effect surface fills storyViewport. Placement
and visibility are independent. A root in an editor measures only its preview
container; no region uses browser viewport dimensions. Page IDs, `PageWrapper`,
`BookRuntime` and the `page` lifetime retain their domain meanings. Old visual
region/plane aliases are not provided.

Both background and frame declarations fill `storyViewport` by default. The
editor's region control compiles a choice into the existing placement and
visibility contract. `belowNarrative` replaces the former author plane name with
its z-index still 2. Background is 0, narrative 3, aboveNarrative 5, Toolbar 10,
aboveControls 20, and host feedback 30.

## Selection

`AppWrapper.selectedVisualEffectId` reaches the persistent root. The root ignores
it unless AppMode is editor. `VisualSelectionOutline` is a sibling of all plane
containers at z-index 40, with `pointer-events: none`, `inert` and `aria-hidden`.
It draws the visibility region's outer rectangle, including rounded corners;
frame bands and circle/polygon masks do not clip the outline. Hidden, absent or
unmeasurable effects have no outline. Clearing selection removes only the overlay.

A white border and black inner line provide contrast without blend isolation
assumptions. The root is already isolated, clipped and optionally color-inverted;
using a separate contrasting overlay avoids inheriting the surface's masks or
being trapped in an author's plane. Selection never changes surface keys, plane,
registration identity, renderer props or animation objects.

The outline uses the same geometry snapshot as all surfaces. It adds no observer,
measurement or polling loop. Existing absolute/inset plane containers and artistic
wrappers already use CSS where their parent supplies bounds. JavaScript remains
necessary for cross-region anchors, independent clipping, scroll coordinates,
frame insets and conversion to visibility-local surface coordinates.

## FrameElement overscan

Keep the existing `height: 101%`. Commit `c1cf279` introduced it deliberately to
extend side elements past the lower page edge. In the 1100×800 Chromium fixture,
the 785px parent produces a 792.84375px element. Forcing 100% changes shadow/text
bounds and 38 visible pixels in the static fixture. Removing it would alter the
artistic rendering rather than simplify region geometry.

The Linux static screenshot was reviewed and recaptured for storyViewport frame
placement. The geometry, masks, painted plane order, scroll tracking, range media
continuity and selection identity are covered by the browser suites.
