import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openBrowserFixture, pixels } from './browserFixture.js';

const open = async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1560, height: 1100 } });
  context.after(() => page.close());
  await page.goto(`${origin}/tests/visualPlayground/?mode=reader`);
  await page.locator('[data-demo-effect="frame"]').waitFor();
  return page;
};
const patch = async (page, options) => {
  await page.evaluate((options) => window.playground.change(options), options);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};
const host = (page, selector) => page.locator(selector).evaluate((node) => node.parentElement.dataset.visualHost ?? node.parentElement.dataset.applicationHost);

test('advancing darkness defaults to the whole viewport frame and supports a split composition', async (context) => {
  const page = await open(context);
  await patch(page, { demo: 'advancing', duration: 2400, color: '#000000' });
  assert.equal(await page.evaluate(() => window.playground.session.getSnapshot().length), 1);
  assert.equal(await host(page, '[data-darkness-phase="frame"]'), 'storyViewportFrame');
  assert.equal(await host(page, '[data-darkness-phase="controls"]'), 'toolbar');
  await page.getByTestId('play').click();
  await page.waitForFunction(() => window.playground.session.runs.read('advancing')?.milestones.includes('frame-covered'));
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  const viewport = await page.locator('[data-story-region="storyViewport"]').boundingBox();
  const color = await pixels(page);
  assert.deepEqual(color(viewport.x + viewport.width / 2, viewport.y + viewport.height - 4), [0, 0, 0], 'frame phase reaches the bottom below Toolbar');
  await page.getByRole('button', { name: 'Стоп / сброс', exact: true }).click();
  await patch(page, { composition: 'multiple' });
  assert.equal(await host(page, '[data-darkness-phase="frame"]'), 'narrativeFrame');
  assert.equal(await host(page, '[data-darkness-phase="controls"]'), 'toolbarFrame');
});

test('frame and through effects select viewport, narrative or Toolbar without coupling their plane', async (context) => {
  const page = await open(context);
  for (const region of ['storyViewportFrame', 'narrativeFrame', 'toolbarFrame']) {
    await patch(page, { demo: 'frame', region, plane: 'belowNarrative' });
    assert.deepEqual(await page.locator('[data-visual-content="frame"]').boundingBox(), await page.locator(`[data-story-region="${region}"]`).boundingBox());
    for (const framePreset of ['pulse', 'police', 'caramel']) {
      await patch(page, { framePreset });
      await page.getByTestId('play').click();
      assert.equal(await page.locator('[data-visual-surface="frame"]').getAttribute('data-visual-plane'), 'belowNarrative');
      assert(await page.locator('[data-effect-id="frame-text"]').evaluate((node) => node.getAnimations({ subtree: true }).some((animation) => animation instanceof CSSAnimation && animation.animationName.includes('scroll-text'))));
      await page.getByRole('button', { name: 'Стоп / сброс', exact: true }).click();
    }
  }
  for (const region of ['storyViewportFrame', 'narrativeFrame']) {
    await patch(page, { demo: 'through', region });
    assert.equal(await host(page, '[data-visual-surface="through"]'), region);
    await page.getByTestId('play').click();
    await page.getByRole('button', { name: 'Стоп / сброс', exact: true }).click();
  }
});

test('Toolbar demonstration exposes two real scopes and changes depth without replacing either renderer', async (context) => {
  const page = await open(context);
  await patch(page, { demo: 'toolbar', plane: 'belowNarrative' });
  const nodes = await page.locator('[data-demo-effect^="toolbar-"]').elementHandles();
  assert.equal(nodes.length, 2);
  for (const region of ['toolbar', 'toolbarFrame']) {
    const id = region === 'toolbar' ? 'toolbar-content' : 'toolbar-frame';
    assert.deepEqual(await page.locator(`[data-visual-content="${id}"]`).boundingBox(), await page.locator(`[data-story-region="${region}"]`).boundingBox());
  }
  await patch(page, { plane: 'aboveStoryControls' });
  assert.equal(await page.locator('[data-visual-surface="toolbar-content"]').getAttribute('data-visual-plane'), 'aboveStoryControls');
  assert((await Promise.all(nodes.map((node) => node.evaluate((element) => element.isConnected)))).every(Boolean));
  await page.locator('[data-welcome-tour-id="bookmarks"]').click();
  await page.getByText('Закладки', { exact: true }).first().waitFor();
});
