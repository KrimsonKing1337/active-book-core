# Updating book length

AppWrapper now publishes config.pages whenever that numeric value changes. Initial
book settings (theme, volume, fonts and body style) still initialize once, so
editing the page array does not reset reader preferences or remount BookVisualRoot.
The editor supplies pages.length from its canonical book and uses the existing
Redux position/navigation; a built book supplies its fixed compiled page count.

Stage 5 also calls visualEffects.setPageCount from AppWrapper. The same session
and existing registrations/controllers remain alive; authored range endpoints are
not shifted or clipped. The editor's current declaration adapters now use this
session, while the direct editor/builder registration integration is deferred.
See [Background/Frame integration](unified-background-frame.md).

The existing Chromium root fixture changes the count to five while checking the
updated navigation label, persistent root and unchanged font setting in reader
and editor modes. Browser/Jest harnesses also resolve the @@ source alias introduced
by the preceding manual refactor, so the existing lifecycle tests run from main.
