# Story Dialog: foundation stage

This stage adds the shared options from `@active-book/types` and a controlled
`StoryDialog` built on `@radix-ui/react-dialog` 1.3.1 (MIT, React 19 compatible).
It does not connect the component to reader actions, Redux or browser history,
replace existing windows, add Popover, or change the visual-effects session.
Merge the accompanying `active-book-types` contracts before this Core change.
The editor's Core TGZ is intentionally unchanged until integration is implemented.

## Geometry and presentation

`container` must be the positioned story viewport, outside the narrative's
scrolling/stacking contexts and outside inert visual hosts. It must have a definite
width and height. The Dialog portal creates an interactive absolute layer there.
A null container renders no portal and never falls back to `document.body`.

Authored `width` and `height` are numeric percentages in `(0, 100]`, defaulting to
75 each. CSS percentages resolve against the story container in both full-page
reader and embedded editor preview. Browser `vw`/`vh` would incorrectly size a
preview dialog against the whole editor window. No ResizeObserver or intrinsic
content measurement is needed. Fullscreen selects 100 x 100 percent without
changing authored values. Text scrolls inside the fixed-size body.

The editor integration will expose these numbers as "Ширина (% окна)" and
"Высота (% окна)". That authoring UI and save/build/reader integration belong to
the next stage, rather than adding partially supported nodes to the current schema.

`mode` is a runtime prop. `getDialogMode` inspects a minimal read-only view of model
nodes: a single image/video is media; a single carousel uses its selected
carouselSlide; all other content is default. Empty/invalid selections use default.
Unknown components and nested unsupported carousels are not inspected recursively.
This helper does not introduce image/video nodes into the serialized schema.
The future content integration must supply validated nodes from the single schema.

The existing Embla renderer will report its selected index to the content adapter.
Inactive slides must never report their own mode. Changing mode does not remount
Dialog or reset user preferences. The shell provides direct image/video layout;
future nested content renderers can inherit `--story-dialog-object-fit`.
Only CSS transitions animate width, height, radius and padding; reduced-motion
disables them. Authored dimensions stay fixed when presentation changes.

## Preferences and lifecycle

Reader fullscreen and contain/cover preferences use the origin-wide localStorage
key `active-book:dialog-preferences`. They are separate from book data. Reader
opens refresh preferences, including when another Dialog instance changed them.
Denied storage and quota errors fall back to memory. Preview neither reads nor
writes reader preferences and keeps its own local state.

Radix owns focus trapping, background scroll isolation, Escape and outside
interaction. The shell restores a connected opener or an explicit `returnFocusRef`.
The future window host must provide a persistent fallback for removed triggers and
suppress restoration during replacement. The dedicated portal layer is above
the current visual-effect planes; it is not a VisualSurface.

`canClose: false` prevents user dismissal. A controlled prop update can still
close/replace the window. The future shared state/history stage will enforce the
agreed Back behavior; this shell deliberately does not add a partial history hook.

Existing Modal/WithModal remain until their consumers can move to general actions.
They are not compatibility adapters for StoryDialog. Hammer is not used here and
remains installed for Narrative. Video pause on slide exit, preserved position
within an open window, and reset on final close belong to the content/lifecycle
integration stage. Radix unmounts closed content in this foundation.

## Validation

Type contracts cover numeric options, exact optional properties and preferences
under NodeNext and Bundler resolution. Core unit tests cover deterministic mode,
dimension validation and storage failures. The browser fixture tests full-page
and embedded sizing, fullscreen restoration, mode changes, long content,
focus trapping/restoration, dismissal locking, preference isolation, mobile
resize, resource cleanup and null-container behavior in StrictMode.

Run `node --test scripts/storyDialog.browser.test.js` with a configured Playwright
Chromium executable, or use the normal `test:browser` suite.

Validated on 2026-11-12: Core and fixture typechecks, full Stylelint, 65 unit tests,
8 SCSS-alias tests and 5 focused Chromium tests pass. New StoryDialog modules pass
ESLint. The full Core ESLint command reports 121 errors and 47 warnings, all in
unchanged files; this stage does not reformat those existing diagnostics.
Types pass declaration typecheck plus NodeNext and Bundler contract tests.
