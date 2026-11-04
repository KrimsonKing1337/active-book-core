# Visual effect registration and lifetime (stage 4)

Current Background/Frame registration, rendering and cleanup supersede the legacy
paths described in this stage; see [stage 5](unified-background-frame.md).

`createVisualEffects({ definitions, pages })` creates a session for one book. Pass
that stable object to `App.visualEffects` or `AppWrapper.visualEffects`. Direct
`StoryVisualRoot` hosts also supply their current `page` prop. The normal AppWrapper
uses the existing Redux current-page selector; no second navigation state is added.
Create the session when opening the book, not during each page render.

## Registration and descriptions

The session accepts the existing shared `VisualEffectDefinition` and
`VisualEffectRegistration` types. A definition's `id` resolves an instance's
`definitionId`. Definitions and their React implementations are copied into a
runtime map; they never appear in the serializable snapshot. Different instance
IDs can use the same definition. Unknown definitions and duplicate definition or
instance IDs throw diagnostic errors before accepting the registration.

The public operations are:

```ts
const visualEffects = createVisualEffects({ definitions, pages: config.pages });
const unregister = visualEffects.register(registration);

visualEffects.update('smoke', {
  effect: { params: { opacity: 0.5 }, visibility: { region: 'story' } },
});
visualEffects.update('smoke', { lifetime: { type: 'page', page: 2 } });
visualEffects.remove('smoke');
unregister(); // Explicit removal; repeated or obsolete cleanup is harmless.
```

Registration is book-owned, even if its description is imported from a page
module. A page component must not tie a range registration's removal to its own
React cleanup. The returned disposer explicitly removes the declaration; it is
not the host's page/range deactivation operation. No new per-page registration
hook or implicit unmount cleanup is introduced.

`getSnapshot()` exposes immutable copies of all registrations, including inactive
ones. It contains JSON descriptions only. `subscribe` is used through React's
`useSyncExternalStore`; snapshot identity stays stable until a change. Updates
preserve other registration objects and unchanged parameter references. ID and
definitionId are immutable; changing the implementation requires remove/register.
`params` updates replace the authored parameter object. Renderer props shallowly
merge it over the definition defaults; nested defaults are not deep-merged.
Definitions use the shared JsonObject parameter boundary; their renderers narrow
and validate definition-specific values. This is not a new builder schema.

Finite JSON data and page positions are validated at the session boundary.
Pages are integers from 1 through the supplied book page count, and range bounds
are inclusive and ordered. An empty range list is inactive. No range sorting,
clamping, shifting or page-ID remapping occurs. The host supplies the page count
for the opened book; editing book structure and its UI remain outside this stage.

A separate Redux slice is unnecessary here: the new session is already scoped to
a single book, whereas the current legacy store is a singleton. The session keeps
serializable descriptions in one map and runtime definitions/controllers in other
maps. No React nodes, refs, timers, DOM or graphics contexts enter its snapshot or
Redux. The existing legacy Redux store and PageWrapper cleanup are unchanged.

## React ownership and transitions

`StoryVisualRoot` remains above routes. Its `useVisualEffectSurfaces` subscription
selects registrations whose lifetime includes the committed current page, then
feeds the existing VisualSurfaces. A page lifetime selects one position; a range
selects the union of its listed intervals. There is no traversal of skipped pages.

A still-active ID stays under the same plane and VisualSurface React parents.
`RegisteredVisualEffect` owns its renderer and optional playback ref. Navigating
1 -> 2 or directly 2 -> 5 within two disjoint intervals preserves the actual DOM
node, React state, resource loads and animation. Navigation calls no playback
commands. Leaving every interval removes that subtree; re-entry creates it anew.
Page lifetime uses the same path and creates a fresh renderer after returning.

A registration generation also keys its content. Remove/register with the same
ID inside one React batch therefore resets the renderer instead of accidentally
reusing it. Delayed disposers and stale activation controllers check ownership
and cannot affect the replacement. Changing one item does not reset other items.

Placement, visibility, mask and order updates retain identity. Geometry is shared
with the existing surfaces. Renderer dimensions use resolved placement; missing
geometry retains the last committed dimensions (initially 0 x 0) and only hides
the surface. Scroll and masks do not change the renderer's parameter or geometry
objects unnecessarily. Manual plane changes still remount, as documented in
[visual placement](visual-placement.md).

One session can have one mounted book host. Closing the book detaches controllers
and unmounts renderers; declarations remain available if that session is explicitly
reopened. Such a reopening starts fresh React instances. Sessions are independent,
including when separate books use the same instance IDs.

## Controllers, playback and resources

`getController(id)` returns a shared `VisualEffectController` for a currently
mounted activation, or undefined when inactive. `destroy()` removes the registration
and triggers React unmount; repeated calls are harmless. A renderer may expose the
shared `VisualPlayback` through its React 19 ref. Static renderers ignore the ref
and have no playback property; they need no fabricated methods.

Playback forwards play (start/resume), pause (preserve position), and stop (reset)
to that renderer. The host does not infer any of these from editor hiding, loading,
mask changes or page transitions. Held playback handles become no-ops after their
activation ends or their underlying ref is replaced. Async play results are returned
to the caller without scheduling host-side updates after completion.

Renderers release their own timers, animation frames, event listeners, graphics
resources and pending async work through React effect cleanup. Controller detachment
only invalidates runtime handles; it does not duplicate renderer cleanup or call
stop as a replacement for destruction. Async renderer work must cancel or ignore
its own obsolete results, since the agreed renderer contract has no host abort
signal. The browser fixture demonstrates cancellation of a pending resource load.

## Verification and next boundary

The existing browser harness adds visualLifecycle scenarios in reader/editor and
StrictMode. Stateful test definitions expose an instance token, advancing internal
counter and independent playback. Metrics track setup/cleanup, pending async loads
and live timer resources. Tests cover page re-entry, neighboring and disjoint range
navigation, absence/loading geometry, updates, independent instances, static
renderers, removal/replacement, stale handles, rapid transitions and closing the
whole book. Existing real Background/Frame hooks remain active in the same fixture.

For the next stage, adapt Background/Frame implementations to shared definitions,
map their authored parameters into registrations, and route both page and range
inputs through this one session. Only after their integration tests prove real
continuity should their old hooks/store cleanup be removed. This stage does not
make legacy range backgrounds continuous or change audio lifetime, builder data,
editor panels, migrations, presets or artistic effects.
