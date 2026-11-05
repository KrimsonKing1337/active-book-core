import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { createServer } from 'vite';
import svgr from 'vite-plugin-svgr';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourcePath = (name) => fileURLToPath(new URL(`../src/${name}`, import.meta.url));
const aliases = ['assets', 'components', 'controllers', 'pages', 'hooks', 'utils', 'store', 'styles'];
const alias = Object.fromEntries(aliases.map((name) => [`@${name}`, sourcePath(name)]));

alias['@@'] = sourcePath('');
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
    optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
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
        await page.goto(`http://127.0.0.1:${address.port}/tests/storyVisualRoot/?mode=${mode}`);
        await page.getByText('Audio unlock', { exact: true }).waitFor();
        assert.equal(await page.getByTestId('audio-unlocked').textContent(), 'false');

        const book = await page.locator('[data-story-region="story"]').elementHandle();
        assert(book);
        assert.equal(await page.getByTestId('editor-tools').evaluate((tools) => {
          return tools.closest('[data-story-region="story"]') === null;
        }), true);

        await page.getByTestId('first').click();
        await page.getByTestId('page-one').waitFor();
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="geometry"]').textContent)
          ?.regions.narrativeContent?.height > 1500);
        assert.equal(await page.getByTestId('audio-unlocked').textContent(), 'true');

        const before = await readGeometry(page);
        const bounds = await page.locator('[data-story-region="story"]').boundingBox();
        const pageBounds = await page.locator('[data-story-region~="narrativeFrame"]').boundingBox();
        assert.equal(before.regions.story.width, bounds.width);
        assert.equal(before.regions.story.height, bounds.height);
        assert.equal(before.regions.narrativeFrame.x, pageBounds.x - bounds.x);
        assert.equal(before.regions.narrativeFrame.y, pageBounds.y - bounds.y);
        assert.equal(before.regions.narrativeFrame.width, pageBounds.width);
        assert.equal(before.regions.narrativeFrame.height, pageBounds.height);
        assert(before.regions.narrativeFrame.height < before.regions.story.height);
        assert.deepEqual(before.regions.frame, before.regions.narrativeFrame);
        const storyViewportBounds = await page.locator('[data-story-region="storyViewport"]').boundingBox();
        assert.equal(before.regions.storyViewport.x, storyViewportBounds.x - bounds.x);
        assert.equal(before.regions.storyViewport.y, storyViewportBounds.y - bounds.y);
        assert.equal(before.regions.storyViewport.width, storyViewportBounds.width);
        assert.equal(before.regions.storyViewport.height, storyViewportBounds.height);
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
          .regions.story.width === 312);
        const mobile = await readGeometry(page);
        assert(mobile.regions.narrativeFrame.width <= 360);
        assert(mobile.regions.narrativeFrame.height < mobile.regions.story.height);

        const layerInfo = await page.locator('[data-visual-plane="belowNarrative"]').evaluate((plane) => {
          const toolbar = document.querySelector('#Toolbar').getBoundingClientRect();
          const frame = document.querySelector('[data-visual-surface="behind-one"]').getBoundingClientRect();
          const hit = document.elementFromPoint(toolbar.x + toolbar.width / 2, toolbar.y + toolbar.height / 2);
          return {
            inert: plane.inert,
            pointerEvents: getComputedStyle(plane).pointerEvents,
            bottom: frame.bottom,
            viewportBottom: document.querySelector('[data-story-region="storyViewport"]').getBoundingClientRect().bottom,
            toolbarTop: toolbar.top,
            toolbarHit: document.querySelector('#Toolbar').contains(hit),
          };
        });
        assert.equal(layerInfo.inert, true);
        assert.equal(layerInfo.pointerEvents, 'none');
        assert.equal(layerInfo.bottom, layerInfo.viewportBottom);
        assert(layerInfo.bottom > layerInfo.toolbarTop);
        assert.equal(layerInfo.toolbarHit, true);
        for (const [id, plane] of [['behind', 'belowNarrative'], ['above', 'aboveNarrative'], ['overlay', 'systemFeedback']]) {
          assert.equal(await page.locator(`[data-visual-plane="${plane}"] [data-effect-id="${id}-one"]`).count(), 1);
        }
        assert.equal(await page.locator('[data-visual-plane="background"]')
          .evaluate((element) => getComputedStyle(element).zIndex), '0');

        const fontButton = page.locator('[data-welcome-tour-id="font"] > div').last();
        await fontButton.click();
        const fontScale = await page.locator('html').evaluate((element) => getComputedStyle(element)
          .getPropertyValue('--font-scale'));
        await page.getByTestId('grow-book').click();
        await page.getByText('1 из 5', { exact: true }).waitFor();
        assert.equal(await page.locator('html').evaluate((element) => getComputedStyle(element)
          .getPropertyValue('--font-scale')), fontScale, 'page count updates preserve reader settings');
        assert.equal(await book.evaluate((element) => element === document.querySelector('[data-story-region="story"]')), true);

        await page.getByTestId('loading').click();
        await page.waitForFunction(() => JSON.parse(document.querySelector('[data-testid="geometry"]').textContent)
          .regions.narrativeFrame === null);
        assert.equal(await book.evaluate((element) => element === document.querySelector('[data-story-region="story"]')), true);
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
        assert.equal(await book.evaluate((element) => element === document.querySelector('[data-story-region="story"]')), true);

        const viewport = await page.locator('[data-story-region="storyViewport"]').elementHandle();
        await page.getByTestId('empty').click();
        await page.waitForFunction(() => document.querySelector('#page-wrapper').dataset.pageId === 'page-3');
        assert.equal(await viewport.evaluate((element) => element === document.querySelector('[data-story-region="storyViewport"]')), true);
        assert(await page.locator('[data-story-region="narrativeFrame"]').isVisible(), 'empty content retains its shell');
        assert.equal(await page.locator('[data-visual-plane]:not([data-visual-plane="systemFeedback"]) [data-effect-id]')
          .count(), 0);
        assert.equal(await book.evaluate((element) => element === document.querySelector('[data-story-region="story"]')), true);
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
  }
});
