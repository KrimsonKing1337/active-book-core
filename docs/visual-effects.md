# Visual effects: book integration (stage 6)

`AppWrapper` owns the default session for its `bookKey`. Pass the complete book's
compiled `registrations` and loaded `definitions`. Page navigation and page-count
changes preserve that key and the session. A project replacement changes the key;
actual unmount destroys the owned session. StrictMode effect replay does not.
An explicitly supplied `visualEffects` session stays caller-owned.

`useVisualRegistrations` reconciles an owner's JSON registrations by ID. Equal
input is skipped; parameter/lifetime changes call update. Removed IDs and changed
definition IDs are released. Missing definitions stay pending outside the session
until libraries load. Hosts diagnose unavailable definitions without discarding
authored data. `setDefinitions` replaces the external definition collection while
preserving builtins, and `destroy` invalidates controllers and releases listeners.

`hiddenVisualEffects` controls presentation without unregistering or stopping
instances. Manual plane changes can still remount a surface. Ordinary geometry,
mask, style and parameter updates keep its registration and renderer identity.

The old useBuiltinDeclarations/useVisualRanges hooks and ReactNode instance map
are removed. Public CSS/media
useBackground and useFrameEffect hooks remain and use the common reconciler.
createBuiltinRegistration remains a pure convenience for those APIs and panel
projection; its module can be imported by the builder without loading renderers.

Audio categories `bg`, `music` and `sfx` use the shared audio slice and page-bound
`useAudio` hook. `BookRuntime` retains `useAudioController` for caller-owned manual
instances. Cross-page audio will be designed separately from visual lifetimes.

Range registration validates positive integer ordered intervals independently of
the current page count. A shortened book preserves endpoints; activation also
requires a current author page. Page lifetimes still validate an existing page.
