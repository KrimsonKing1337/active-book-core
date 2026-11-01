import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { createServer } from 'vite';
import svgr from 'vite-plugin-svgr';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourcePath = (name) => fileURLToPath(new URL(`../src/${name}`, import.meta.url));
const aliases = ['assets', 'components', 'pages', 'hooks', 'utils', 'store', 'styles'];
const alias = Object.fromEntries(aliases.map((name) => [`@${name}`, sourcePath(name)]));

alias['@types'] = sourcePath('@types.ts');
alias['~styles'] = sourcePath('styles');
alias['~assets'] = sourcePath('assets');

const readGeometry = async (page) => JSON.parse(await page.getByTestId('geometry').textContent());

test('persistent book root and existing page rendering in Chromium', async (context) => {
  const server = await createServer({
    configFile: false,
    root,
    plugins: [svgr({ include: '**/*.svg' })],
    resolve: { alias },
    define: { 'process.env.mode': JSON.stringify('development') },
    optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router-dom'] },
    server: { host: '127.0.0.1', port: 0 },
  });

  context.after(() => server.close());
  await server.listen();

  const address = server.httpServer.address();
  assert(address && typeof address === 'object');

  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  context.after(() => browser.close());

  for (const mode of ['reader', 'editor']) {
    await context.test(mode, async () => {
      const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));

      try {
        await page.goto(`http://127.0.0.1:${address.port}/tests/bookVisualRoot/?mode=${mode}`);
        await page.getByText('Audio unlock', { exact: true }).waitFor();
        assert.equal(await page.getByTestId('audio-unlocked').textContent(), 'false');

        const book = await page.locator('[data-book-region="book"]').elementHandle();
        assert(book);
        assert.equal(await page.getByTestId('editor-tools').evaluate((tools) => {
          return tools.closest('[data-book-region="book"]') === null;
        }), true);

        await page.getByTestId('first').click();
        await page.getByTestId('page-one').waitFor();
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="geometry"]').textContent)
          ?.regions.narrativeContent?.height > 1500);
        assert.equal(await page.getByTestId('audio-unlocked').textContent(), 'true');

        const before = await readGeometry(page);
        const bounds = await page.locator('[data-book-region="book"]').boundingBox();
        const pageBounds = await page.locator('[data-book-region~="page"]').boundingBox();
        assert.equal(before.regions.book.width, bounds.width);
        assert.equal(before.regions.book.height, bounds.height);
        assert.equal(before.regions.page.x, pageBounds.x - bounds.x);
        assert.equal(before.regions.page.y, pageBounds.y - bounds.y);
        assert.equal(before.regions.page.width, pageBounds.width);
        assert.equal(before.regions.page.height, pageBounds.height);
        assert(before.regions.page.height < before.regions.book.height);
        assert.deepEqual(before.regions.frame, before.regions.page);
        assert(before.frameInsets.left > 0);

        await page.locator('#narrative').evaluate((element) => { element.scrollTop = 200; });
        await page.waitForFunction((previousY) => JSON.parse(document.querySelector('[data-testid="geometry"]')
          .textContent).regions.narrativeContent.y < previousY - 190, before.regions.narrativeContent.y);
        const scrolled = await readGeometry(page);
        assert.equal(scrolled.regions.narrativeViewport.y, before.regions.narrativeViewport.y);
        assert.equal(scrolled.regions.narrativeContent.height, before.regions.narrativeContent.height);

        await page.locator('#narrative').evaluate((element) => { element.scrollTop = 0; });
        await page.getByTestId('expand').click();
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="geometry"]').textContent)
          .regions.narrativeContent.height > 2300);

        await page.setViewportSize({ width: 360, height: 640 });
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="geometry"]').textContent)
          .regions.book.width === 312);
        const mobile = await readGeometry(page);
        assert(mobile.regions.page.width <= 360);
        assert(mobile.regions.page.height < mobile.regions.book.height);

        const layerInfo = await page.locator('#frame-effects').evaluate((frame) => {
          const toolbar = document.querySelector('#Toolbar').getBoundingClientRect();
          const rect = frame.getBoundingClientRect();
          const hit = document.elementFromPoint(toolbar.x + toolbar.width / 2, toolbar.y + toolbar.height / 2);
          return {
            inert: frame.inert,
            pointerEvents: getComputedStyle(frame).pointerEvents,
            bottom: rect.bottom,
            toolbarTop: toolbar.top,
            toolbarHit: document.querySelector('#Toolbar').contains(hit),
            layers: Array.from(frame.children).map((layer) => getComputedStyle(layer).zIndex),
          };
        });
        assert.equal(layerInfo.inert, true);
        assert.equal(layerInfo.pointerEvents, 'none');
        assert(layerInfo.bottom <= layerInfo.toolbarTop + 1);
        assert.equal(layerInfo.toolbarHit, true);
        assert.deepEqual(layerInfo.layers, ['1', '4', '30']);
        for (const layer of ['behind', 'above', 'overlay']) {
          assert.equal(await page.locator(`[data-frame-layer="${layer}"] [data-effect-id="${layer}-one"]`).count(), 1);
        }
        assert.equal(await page.locator('#background-effects').evaluate((element) => getComputedStyle(element).zIndex), '0');

        await page.getByTestId('loading').click();
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="geometry"]').textContent)
          .regions.page === null);
        assert.equal(await book.evaluate((element) => element === document.querySelector('[data-book-region="book"]')), true);
        await page.getByTestId('loading').click();
        await page.getByTestId('page-one').waitFor();

        await page.getByTestId('second').click();
        await page.getByTestId('page-two').waitFor();
        assert.equal(await page.getByTestId('page-one').count(), 0);
        assert.equal(await page.locator('[data-effect-id="background-one"]').count(), 0);
        assert.equal(await page.locator('[data-effect-id="behind-one"]').count(), 0);
        assert.equal(await page.locator('[data-effect-id$="-one"]').count(), 0);
        await page.locator('[data-effect-id="background-two"]').waitFor();
        await page.locator('[data-effect-id="behind-two"]').waitFor();
        assert.equal(await book.evaluate((element) => element === document.querySelector('[data-book-region="book"]')), true);

        await page.getByTestId('empty').click();
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="geometry"]').textContent)
          .regions.page === null);
        assert.equal(await page.locator('[data-effect-id]').count(), 0);
        assert.equal(await book.evaluate((element) => element === document.querySelector('[data-book-region="book"]')), true);
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
  }
});
