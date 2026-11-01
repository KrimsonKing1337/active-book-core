# Updating book length

AppWrapper now publishes config.pages whenever that numeric value changes. Initial
book settings (theme, volume, fonts and body style) still initialize once, so
editing the page array does not reset reader preferences or remount BookVisualRoot.
The editor supplies pages.length from its canonical book and uses the existing
Redux position/navigation; a built book supplies its fixed compiled page count.

createVisualEffects and its fixed-count validation contract are unchanged. The
editor's legacy renderers do not yet use that session. Its later integration must
update session validation limits without recreating active effects or remapping
authored positional ranges; no artificial dependency is added here.

The existing Chromium root fixture changes the count to five while checking the
updated navigation label, persistent root and unchanged font setting in reader
and editor modes. Browser/Jest harnesses also resolve the @@ source alias introduced
by the preceding manual refactor, so the existing lifecycle tests run from main.
