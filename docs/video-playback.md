# Video playback ownership

Core Video uses `useCarouselSlideActive()` and the existing DialogMedia scope.
The internal carousel context distinguishes standalone content from a selected
slide; the public hook still returns `true` outside a carousel. No selected index
is copied into Video or Redux.

## Owners

- Ordinary page Video retains the AppContent autoplay pass after reader readiness.
- Carousel Video owns its play/pause lifecycle locally, after reader readiness.
- DialogMedia supplies an instance-bound `isCurrentWindow` scope to its nested
  Video components. WithModal already keys that content by `instanceId`.
- The global pass skips managed Video and both local ownership boundaries.

Video's local playback record belongs to one element/source cycle. It contains
user intent, pending-request generation and queued programmatic-pause markers.
It is not a global registry or another manager competing to start the same video.

## Intent and position

First eligible activation honors `autoPlay`. Leaving a slide pauses its element
without seeking. A queued programmatic pause event does not erase playing intent.
On return, previously playing video resumes; manual pause and natural completion
remain paused. Manual play of an `autoPlay=false` video establishes resumable intent.
The synchronous paused flag also protects a user pause whose event has not yet
been delivered when selection changes.

Resize, Embla reInit and unrelated rerenders do not create a new playback cycle.
Changing `id` or `src` retires the old cycle, starts position and intent afresh,
and prevents an old metadata callback from restoring the previous position.
Existing page time persistence remains separate from mounted-slide position.

## Async and disposal

Each play request captures its generation and source. Stale rejection cannot
change the new source's controls or intent. Fulfillment rechecks activity, user
intent and the current-window guard. Deactivation and final removal pause the
element; native pause/load cancels pending browser playback.

NotAllowedError exposes controls for manual play; AbortError is expected.
Unexpected errors are reported with the request's source, including retired
requests, without changing the current playback cycle.

StrictMode reconnects the same local record and listeners before queued final
disposal runs. Replay neither seeks nor removes the source nor starts another
request. Final disposal is idempotent. Dialog close/replacement stops and resets
all nested videos; reopening uses new instance-bound content at position zero.
Ordinary page removal pauses playback while retaining its existing time-cache
policy. The separate known page-transition cache-cleanup defect is unchanged.

## Native content boundary

DialogMedia retains one initial play attempt for ordinary native video outside a
carousel, and stops/resets it on final close. It does not force-start native video
inside a carousel and suppresses its initial native autoplay attribute.

Use Core Video for carousel media. Arbitrary native video inside custom carousel
content does not implement the React activity contract: later manual playback,
dynamic native insertions and source changes are the custom component's concern.
There is no DOM observer or universal media manager for such content.

StoryDialog remains a presentation shell. Custom dialog compositions that render
Video should supply the same DialogMedia scope/lifetime as WithModal rather than
expecting the shell to infer media ownership from DOM or ReactNode contents.

## Browser diagnostics

Chromium can emit `ResizeObserver loop completed with undelivered notifications`
around native controls in carousel/dialog transitions or teardown. It was also
observed with an unchanged main checkout. Playback assertions pass; the browser
fixtures retain the repository's page-exception checks. No production error
filter or carousel/Dialog layout workaround is added in this stage.
