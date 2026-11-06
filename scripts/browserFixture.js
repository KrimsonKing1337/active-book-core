import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { createServer } from 'vite';
import svgr from 'vite-plugin-svgr';

export const openBrowserFixture = async (context) => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const sourcePath = (name) => fileURLToPath(new URL(`../src/${name}`, import.meta.url));
  const aliases = ['assets', 'components', 'controllers', 'pages', 'hooks', 'utils', 'store', 'styles'];
  const alias = Object.fromEntries(aliases.map((name) => [`@${name}`, sourcePath(name)]));
  alias['@@'] = sourcePath('');
  alias['@types'] = sourcePath('@types.ts');
  alias['~styles'] = sourcePath('styles');
  alias['~assets'] = sourcePath('assets');

  const server = await createServer({
    configFile: false,
    root,
    plugins: [svgr({ include: '**/*.svg' })],
    resolve: { alias },
    define: { 'process.env.mode': JSON.stringify('development') },
    optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
    server: { host: '127.0.0.1', port: 0 },
  });
  context.after(() => server.close());
  await server.listen();
  const address = server.httpServer.address();
  assert(address && typeof address === 'object');

  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  context.after(() => browser.close());
  return { browser, origin: `http://127.0.0.1:${address.port}` };
};

/** Test-only expected boxes read directly from the browser, independent of player implementation. */
export const readRegions = (page) => page.evaluate(() => {
  const story = document.querySelector('[data-story-region="story"]');
  const storyBox = story.getBoundingClientRect();
  const regions = {};

  for (const name of ['application', 'story', 'storyViewport', 'storyViewportFrame', 'narrativeFrame', 'narrativeViewport', 'narrativeContent', 'toolbar', 'toolbarFrame']) {
    const element = name === 'application' ? document.querySelector('[data-book-application]')
      : document.querySelector(`[data-story-region="${name}"]`);
    let bounds = null;

    if (element?.getClientRects().length) {
      const box = element.getBoundingClientRect();
      bounds = { x: box.x - storyBox.x, y: box.y - storyBox.y, width: box.width, height: box.height,
        borderRadius: getComputedStyle(element).borderRadius };
    }

    regions[name] = bounds;
  }


  const style = getComputedStyle(document.querySelector('#narrative'));
  const frameInsets = { top: parseFloat(style.paddingTop), right: parseFloat(style.paddingRight),
    bottom: parseFloat(style.paddingBottom), left: parseFloat(style.paddingLeft) };
  return { regions, frameInsets };
});
export const surface = (page, id = 'probe') => page.locator(`[data-visual-content="${id}"]`);
export const visibility = (page, id = 'probe') => page.locator(`[data-visual-surface="${id}"]`);

export const setSurfaces = async (page, items) => {
  await page.evaluate((items) => window.setVisualTestSurfaces(items), items);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};

export const pixels = async (page) => {
  const screenshot = PNG.sync.read(await page.screenshot());
  return (x, y) => {
    const offset = (Math.floor(y) * screenshot.width + Math.floor(x)) * 4;
    return [...screenshot.data.subarray(offset, offset + 3)];
  };
};

export const near = (actual, expected, label) => {
  assert(Math.abs(actual - expected) < 1, `${label}: ${actual} != ${expected}`);
};
