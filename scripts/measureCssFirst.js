import { writeFile } from 'node:fs/promises';
const root = process.argv[2];
const { openBrowserFixture } = await import(`${root}/scripts/browserFixture.js`);
const cleanup = [];
const { browser, origin } = await openBrowserFixture({ after(fn) { cleanup.push(fn); } });
try {
  const page = await browser.newPage({ viewport: { width: 1560, height: 1100 } });
  await page.addInitScript(() => {
    window.benchmark = { rectReads: 0, observers: 0, commits: 0 };
    let renderer = 0;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true, renderers: new Map(),
      inject(value) { const id = ++renderer; this.renderers.set(id, value); return id; },
      onCommitFiberRoot() { window.benchmark.commits++; },
      onCommitFiberUnmount() {}, onPostCommitFiberRoot() {},
    };
    const read = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.matches('[data-story-region], [data-book-application]')) window.benchmark.rectReads++;
      return read.call(this);
    };
    const Observer = window.ResizeObserver;
    window.ResizeObserver = class extends Observer {
      constructor(...args) { super(...args); window.benchmark.observers++; }
    };
  });
  await page.goto(`${origin}/tests/visualPlayground/?mode=reader`);
  await page.locator('[data-demo-effect="frame"]').waitFor();
  await page.evaluate(() => { window.benchmark.commits = 0; window.benchmark.rectReads = 0; });
  await page.evaluate(() => window.playground.play());
  await page.waitForTimeout(1000);
  const playback = await page.evaluate(() => ({ ...window.benchmark }));
  await page.evaluate(() => {
    window.benchmark.rectReads = 0;
    document.querySelector('#narrative').scrollTop = 250;
    window.playground.change({ width: 900 });
  });
  await page.waitForTimeout(250);
  const resizeAndScroll = await page.evaluate(() => ({ ...window.benchmark }));
  const result = { scenario: 'Chromium 1560x1100; 1000ms frame playback, then scroll+resize and 250ms settle', playback, resizeAndScroll };
  await writeFile(process.argv[3], JSON.stringify(result, null, 2)+'\n');
  console.log(JSON.stringify(result));
  await page.close();
} finally {
  for (const fn of cleanup.reverse()) await fn();
}
