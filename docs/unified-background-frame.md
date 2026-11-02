# Background and Frame on the visual session

Stage 6 supersedes the temporary declaration/ReactNode bridge described here.
See [visual-effects.md](visual-effects.md) for the current book integration contract.

Stage 5 uses the existing visual session for real Background and Frame rendering.
It keeps the artistic implementations (Img, Video, Shadow, FrameElement,
FrameShadow, Police, Caramelldansen and FrameText) and removes their second
instance store and second rendering tree.

## Location and public API

The former src/visualEffects directory now lives at src/controllers/visualEffects.
The public entry is activeBook-core/controllers/visualEffects; createVisualEffects is no longer
exported from components. The session always includes builtin.background,
builtin.frame and the host-owned builtin.frameFeedback definitions. The optional
definitions argument supplies additional book definitions, with unique IDs.

AppWrapper creates one session for its mounted book unless a session is supplied.
It provides that session before running AppContent hooks and keeps BookVisualRoot
mounted during navigation. It calls setPageCount when config.pages changes;
registrations, controllers and renderer identity are retained. getPageCount and
the existing subscription notify implicit page declarations about bound changes.
Those declarations wait while a previous project's navigation position is outside
the new book, and activate when the position/count become consistent. Existing positional
range endpoints are not rewritten or clipped. New lifetimes are still validated
against the current count, and invalid numeric counts are rejected.

## Definitions and declarations

The built-in Background definition renders the existing color/style, shadow,
image, video and React-component branches. The Frame definition uses the existing
shadow/text/component branches, including pulse, police, caramel and scroll.

Background, Frame, useBackground and useFrameEffect are small declaration
adapters over the common session. They are the temporary connection for the
current editor and compiled reader, not a second lifetime system. With no explicit
lifetime, a mounted declaration follows the current author page; an explicit
VisualEffectLifetime is available for fixed page and persistent range declarations.
The rangeEffects prop also translates background/frame entries to registrations
once, rather than selecting and rebuilding them on each navigation.

```tsx
<Frame
  id="long-lived-frame"
  kind="component"
  Component={<ExistingBookComponent />}
  lifetime={{ type: 'range', range: [{ from: 1, to: 3 }, { from: 5, to: 5 }] }}
/>
```

A declaration which owns a range must be placed outside changing page components.
Unmounting any declaration removes its registration. Data-driven consumers can
instead register createBuiltinRegistration(...) on their book-owned session.

Parameters are a JSON copy of the typed options. IDs, React nodes and the obsolete
inRange flag are not parameters. A per-session runtime component bridge retains
existing ReactNode inputs outside serialized snapshots; remove/unregister clears
it. The new contract already supports normal custom VisualEffectDefinition
renderers directly, without this bridge. The bridge is retained until the editor,
builder and TGZ component descriptions supply definition IDs and serializable
parameters directly.

useFrameEffects updates those registrations, including nested style/animation
merging and depth changes. Flashlight and vibration preview only replace their
visual registration/update path; hardware handling, timing, audio and device
visibility behavior remain specialized.

## Placement and visibility

- Backgrounds fill bookViewport on the background plane. bookViewport is the
  fixed inner player rectangle, including its controls. It preserves the old
  image/video fitting dimensions when the outer book root is wider or padded.
- Ordinary frames fill page, below the narrative on scene or above it on
  aboveNarrative. Existing inner FrameElement positioning, sides and thickness
  remain renderer parameters.
- Component frame masks use the shared frame visibility and measured insets.
- Region clipping carries the inner player's rounded corners. A shorter page
  keeps the top corners without adding false rounded corners above the toolbar.
- Author plane order is background / scene / aboveNarrative / aboveControls.
  Equal depth orders use the common instance-ID ordering. Numeric z-index options
  become depth.order; the planes remain separate stacking contexts.
- Host definition metadata selects a systemFeedback surface layer above all author
  planes. It is not part of author VisualPlane. This protects flashlight and
  vibration feedback without effect-specific branches in VisualSurfaces.

All surfaces remain inert with pointer events disabled. Toolbar and editor tools
retain their established interaction priority. Placement, masks, order and size
updates reuse the renderer while its plane is unchanged. Changing plane can
remount it, as already agreed. Changing the actual artistic component/preset or
media source may replace that implementation/resource as needed.

## Lifetime and resources

VisualEffectLifetime is the sole activation rule. React keys use registration
identity/generation, never the current page. A direct jump between any two active
pages, including disjoint intervals, retains the component, its state, image/video
DOM and CSS Animation object. Geometry gaps hide the surface without deleting
its active renderer. Leaving every interval unmounts it; reentry starts a fresh
activation.

Background video uses the existing Video renderer with per-activation time:
it does not restore the old videosCurrentTime entry. Actual detach pauses and
releases its source. A guarded microtask distinguishes detach from StrictMode
replay of effects while the same element remains connected. Loading counters
handle already-loaded media during replay; there is no polling loop.

Redux keeps only the shared loading counters, volume and other specialized
state. A discovered reducer bug is corrected: setVideosReadyAmount previously
wrote dotLottieReadyAmount and could keep the video loader pending forever.

Removed infrastructure:

- Redux Background/Frame instance slices, selectors and Frame update sagas.
- useBackgroundInRange's page-by-page Redux reconciliation.
- BackgroundEffects/FrameEffects global rendering trees and their layer wrappers.
- PageWrapper's bulk Background/Frame cleanup.
- The unused legacy background equality helper and inRange marker.

The existing audio range path, PageWrapper segment cleanup, editor preview
providers and current book.json/builder format stay in place. None competes with
the visual session's activation rule.

## Verification and next integration

The real-effect Chromium fixture runs in StrictMode, in reader and editor modes.
It covers page activation/cleanup, adjacent/direct/disjoint-range jumps, fresh
reentry, counters, image/video request and DOM identity, all animated shadow
presets, text, masks, CSS filters, geometry/scroll/resize updates and page-count
changes. Existing placement tests cover actual painted priority, toolbar access,
flashlight and vibration feedback.

The static screenshot reference was captured from unmodified main at 13fda23
using the same fixture before this refactor. It includes a filtered image,
frame shadow/text/mask and the toolbar. It was visually reviewed; the new
implementation passes the comparison without replacing that reference. The
fixture movie is locally generated: a four-second 32x32 navy WebM, with no audio.

Core checks: npm run typecheck, npm run typecheck:test, Jest, npm run test:browser,
changed-file ESLint, changed-SCSS Stylelint, test:scss-alias and npm run make.
The editor uses the new local core archive and runs its TypeScript, Vitest unit,
component and browser suites, production editor build and its real editor-to-built
book Playwright scenario. No book schema or panel rewrite is part of this stage.

The final integration should create and retain a book-owned session in the editor
and reader, compile registrations and lifetimes directly, reconcile editor edits
by stable instance IDs, and adapt existing TGZ definitions to the common renderer
contract. It can then remove the ReactNode/declaration bridge. This stage does not
introduce a new TGZ loader, migrations, composition UI or new artistic effects.
