import assert from 'node:assert/strict';
import { test } from 'node:test';

import { near, openBrowserFixture, pixels, readRegions, setSurfaces, surface, visibility } from './browserFixture.js';

const px = (value) => ({ value, unit: 'px' });
const percent = (value) => ({ value, unit: '%' });
const point = (x, y) => ({ x: percent(x), y: percent(y) });
const fill = (region = 'story') => ({
  region: region,
  anchor: 'top-left',
  origin: 'top-left',
  offset: { x: px(0), y: px(0) },
  size: { width: percent(100), height: percent(100) },
});
const item = (options = {}) => ({
  id: 'probe',
  placement: fill(),
  visibility: {},
  depth: { plane: 'aboveStoryControls', order: 0 },
  background: '#ff0000',
  ...options,
});

const bookBounds = (page) => page.locator('[data-story-region="story"]').boundingBox();
const token = (page) => page.locator('[data-probe="probe"]').getAttribute('data-token');
const center = (rect) => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

// These tests sample browser screenshots, including legacy content and controls beneath the surfaces.
test('visual placement in Chromium', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);

  const scenario = async ({ name, mode = 'editor' }, run) => context.test(name, async () => {
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(`${origin}/tests/visualPlacement/?mode=${mode}`);
      await page.getByTestId('first').click();
      await page.getByTestId('page-one').waitFor();
      await page.waitForFunction(() => window.setVisualTestSurfaces
        && document.querySelector('[data-story-region="narrativeContent"]'));
      await run(page);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });

  await scenario({ name: 'all coordinate regions, mixed units, anchors and origins' }, async (page) => {
    const geometry = await readRegions(page);
    const book = await bookBounds(page);
    for (const region of ['story', 'storyViewport', 'narrativeFrame', 'storyViewportFrame', 'narrativeViewport', 'narrativeContent']) {
      const placement = {
        ...fill(region),
        anchor: 'bottom-right',
        origin: 'center',
        offset: { x: percent(-10), y: px(-7) },
        size: { width: percent(25), height: px(32) },
      };
      await setSurfaces(page, [item({ placement })]);
      const actual = await surface(page).boundingBox();
      const rect = geometry.regions[region];
      near(actual.width, rect.width * 0.25, `${region} width`);
      near(actual.height, 32, `${region} height`);
      near(actual.x, book.x + rect.x + rect.width * 0.775, `${region} x`);
      near(actual.y, book.y + rect.y + rect.height - 23, `${region} y`);
    }
  });

  await scenario({ name: 'content uses its native scrollport and viewport surfaces remain fixed' }, async (page) => {
    await setSurfaces(page, [item({ placement: fill('narrativeContent') })]);
    const originalToken = await token(page);
    const before = await surface(page).boundingBox();
    const scrollport = await page.locator('[data-story-region="narrativeViewport"]').boundingBox();
    assert.notDeepEqual((await pixels(page))(scrollport.x + 5, scrollport.y - 3), [255, 0, 0]);
    await page.locator('#narrative').evaluate((element) => { element.scrollTop = 60; });
    near((await surface(page).boundingBox()).y, before.y - 60, 'native content scroll');
    assert.equal(await token(page), originalToken);
    await setSurfaces(page, [item({ placement: fill('narrativeViewport') })]);
    const fixedBefore = await surface(page).boundingBox();
    await page.locator('#narrative').evaluate((element) => { element.scrollTop = 120; });
    assert.deepEqual(await surface(page).boundingBox(), fixedBefore);
  });

  await scenario({ name: 'visibility rectangles and actual frame side masks' }, async (page) => {
    const geometry = await readRegions(page);
    const book = await bookBounds(page);
    for (const region of ['story', 'storyViewport', 'narrativeFrame', 'narrativeViewport', 'narrativeContent']) {
      await setSurfaces(page, [item({ placement: fill(region) })]);
      const clip = await visibility(page).boundingBox();
      const rect = geometry.regions[region];
      near(clip.x, book.x + rect.x, `${region} clip x`);
      near(clip.y, book.y + rect.y, `${region} clip y`);
      near(clip.width, rect.width, `${region} clip width`);
      near(clip.height, rect.height, `${region} clip height`);
    }
    const frame = geometry.regions.storyViewportFrame;
    const positions = {
      left: [book.x + frame.x + 2, book.y + frame.y + frame.height / 2],
      right: [book.x + frame.x + frame.width - 3, book.y + frame.y + frame.height / 2],
      top: [book.x + frame.x + frame.width / 2, book.y + frame.y + 2],
      bottom: [book.x + frame.x + frame.width / 2, book.y + frame.y + frame.height - 3],
    };
    for (const sides of [[], ['left'], ['top', 'right'], ['bottom'], ['top', 'right', 'bottom', 'left']]) {
      await setSurfaces(page, [item({ placement: fill('storyViewportFrame'), visibility: { sides } })]);
      const color = await pixels(page);
      for (const [side, position] of Object.entries(positions)) {
        assert.equal(color(...position).join(',') === '255,0,0', sides.includes(side), `${sides}: ${side}`);
      }
      const middle = center(frame);
      assert.notDeepEqual(color(book.x + middle.x, book.y + middle.y), [255, 0, 0]);
    }
  });

  await scenario({ name: 'circle, polygon and intersection with the frame mask' }, async (page) => {
    const book = await bookBounds(page);
    const middle = center(book);
    const radius = Math.hypot(book.width, book.height) / Math.SQRT2 * 0.2;
    const circle = { type: 'circle', center: point(50, 50), radius: percent(20) };
    await setSurfaces(page, [item({ visibility: { mask: circle } })]);
    const originalToken = await token(page);
    let color = await pixels(page);
    assert.deepEqual(color(middle.x, middle.y), [255, 0, 0]);
    assert.deepEqual(color(middle.x + radius - 4, middle.y), [255, 0, 0]);
    assert.notDeepEqual(color(middle.x + radius + 4, middle.y), [255, 0, 0]);

    const polygon = { type: 'polygon', points: [point(10, 10), point(90, 10), point(50, 90)] };
    await setSurfaces(page, [item({ visibility: { mask: polygon } })]);
    color = await pixels(page);
    assert.deepEqual(color(middle.x, middle.y), [255, 0, 0]);
    assert.notDeepEqual(color(book.x + book.width * 0.15, middle.y), [255, 0, 0]);
    assert.equal(await token(page), originalToken);

    const geometry = await readRegions(page);
    const frame = geometry.regions.storyViewportFrame;
    const frameMask = { type: 'polygon', points: [point(0, 0), point(50, 0), point(50, 100), point(0, 100)] };
    await setSurfaces(page, [item({ placement: fill('storyViewportFrame'), visibility: { sides: ['top', 'left', 'right'], mask: frameMask } })]);
    color = await pixels(page);
    assert.deepEqual(color(book.x + frame.x + 2, book.y + frame.y + frame.height / 2), [255, 0, 0]);
    assert.notDeepEqual(color(book.x + frame.x + frame.width - 3, book.y + frame.y + frame.height / 2), [255, 0, 0]);
    assert.notDeepEqual(color(book.x + frame.x + frame.width * 0.25, book.y + frame.y + frame.height / 2), [255, 0, 0]);
  });

  await scenario({ name: 'one continuous gradient crosses logical boundaries and survives edits' }, async (page) => {
    const gradient = 'linear-gradient(to right, rgb(0, 0, 0), rgb(255, 255, 255))';
    const probe = item({ placement: fill('narrativeFrame'), visibility: {}, background: gradient });
    await setSurfaces(page, [probe]);
    const originalToken = await token(page);
    const geometry = await readRegions(page);
    const book = await bookBounds(page);
    const frame = geometry.regions.storyViewportFrame;
    const color = await pixels(page);
    for (const localX of [geometry.frameInsets.left - 2, geometry.frameInsets.left + 2, frame.width / 2]) {
      const actual = color(book.x + frame.x + localX, book.y + frame.y + frame.height / 2)[0];
      const expected = 255 * localX / frame.width;
      assert(Math.abs(actual - expected) < 2, `continuous gradient ${actual} != ${expected}`);
    }
    assert.equal(await page.locator('[data-probe="probe"]').count(), 1);
    await setSurfaces(page, [item({ ...probe, placement: { ...fill('narrativeFrame'), origin: 'top-left', offset: { x: px(0), y: px(1) } } })]);
    assert.equal(await token(page), originalToken);
    await setSurfaces(page, [probe]);
    await page.setViewportSize({ width: 700, height: 650 });
    await page.waitForFunction(() => document.querySelector('[data-story-region="story"]').getBoundingClientRect().width === 652);
    near((await surface(page).boundingBox()).width, (await readRegions(page)).regions.narrativeFrame.width, 'resize');
    assert.equal(await token(page), originalToken);

    await page.getByTestId('empty').click();
    await page.waitForFunction(() => document.querySelector('#story-shell').dataset.pageId === 'page-3');
    await visibility(page).waitFor({ state: 'visible' });
    assert.equal(await token(page), originalToken);
    await setSurfaces(page, [probe]);
    await visibility(page).waitFor({ state: 'visible' });
    await page.getByTestId('second').click();
    await page.getByTestId('page-two').waitFor();
    await setSurfaces(page, [probe]);
    await visibility(page).waitFor({ state: 'visible' });
    assert.equal(await token(page), originalToken);
  });

  await scenario({ name: 'painted depth, lexical ties and legacy feedback priority' }, async (page) => {
    // Give real legacy narrative/Toolbar opaque test colors to measure which plane actually paints last.
    await page.locator('[data-story-region="narrativeContent"] > [class*="Text"]').evaluate((element) => {
      element.style.background = '#00ff00';
    });
    await page.locator('#Toolbar').evaluate((element) => { element.style.background = '#0000ff'; });
    const geometry = await readRegions(page);
    const book = await bookBounds(page);
    const narrative = geometry.regions.narrativeContent;
    const narrativePoint = [book.x + narrative.x + narrative.width / 2, book.y + narrative.y + 150];
    const control = page.locator('[data-welcome-tour-id="font"]');
    await control.evaluate((element) => { element.style.background = '#0000ff'; });
    const toolbar = await control.boundingBox();
    const toolbarPoint = [toolbar.x + 1, toolbar.y + toolbar.height - 1];

    let previousToken;
    for (const plane of ['belowNarrative', 'aboveNarrative', 'aboveStoryControls']) {
      await setSurfaces(page, [item({ depth: { plane, order: Number.MAX_SAFE_INTEGER } })]);
      const currentToken = await token(page);
      if (previousToken) assert.equal(currentToken, previousToken, 'layer changes retain the same native surface');
      previousToken = currentToken;
      const color = await pixels(page);
      assert.deepEqual(color(...narrativePoint), plane === 'belowNarrative' ? [0, 255, 0] : [255, 0, 0], plane);
      assert.deepEqual(color(...toolbarPoint), plane === 'aboveStoryControls' ? [255, 0, 0] : [0, 0, 255], plane);
    }
    await setSurfaces(page, [
      item({ id: 'z', background: '#ffff00', depth: { plane: 'aboveStoryControls', order: 5 } }),
      item({ id: 'a', background: '#ff0000', depth: { plane: 'aboveStoryControls', order: 5 } }),
      item({ id: 'last-input', background: '#000000', depth: { plane: 'aboveStoryControls', order: -10 } }),
      item({ id: 'lower-plane', background: '#00ff00', depth: { plane: 'aboveNarrative', order: 1e20 } }),
    ]);
    assert.deepEqual((await pixels(page))(...narrativePoint), [255, 255, 0]);

    await setSurfaces(page, [item({ background: '#000000' })]);
    const frame = geometry.regions.storyViewportFrame;
    const feedbackPoint = [book.x + frame.x + 1, book.y + frame.y + frame.height / 2];
    assert.deepEqual((await pixels(page))(...feedbackPoint), [0, 0, 0]);
    await page.getByTestId('preview').click();
    assert((await pixels(page))(...feedbackPoint).some((channel) => channel > 30), 'vibration above author');
    await page.getByTestId('stop-preview').click();
    await page.getByTestId('flash').click();
    await page.locator('[data-effect-id^="flashlight-frame-"]').evaluate((element) => {
      for (const animation of element.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 500;
      }
    });
    assert((await pixels(page))(...feedbackPoint).every((channel) => channel > 30), 'flashlight above author');
    await page.getByTestId('stop-flash').click();

    const originalToken = await token(page);
    await page.getByTestId('invert').click();
    assert.deepEqual((await pixels(page))(...narrativePoint), [255, 255, 255], 'inversion includes author surface');
    assert.equal(await token(page), originalToken);
    await setSurfaces(page, [item({ background: '#000000', depth: { plane: 'belowNarrative', order: 0 } })]);
    assert.deepEqual((await pixels(page))(...narrativePoint), [255, 0, 255], 'inversion preserves narrative priority');
    await page.getByTestId('stop-invert').click();
  });

  await scenario({ name: 'reader menu remains interactive below visual surfaces', mode: 'reader' }, async (page) => {
    await setSurfaces(page, [item({ depth: { plane: 'aboveStoryControls', order: 5 } })]);
    const menuButton = page.locator('[data-welcome-tour-id="config"]');
    await menuButton.click();
    const menuHeader = await page.getByText('Настройки', { exact: true }).elementHandle();
    await page.getByText('Настройки', { exact: true }).locator('..')
      .getByRole('button', { name: 'Закрыть', exact: true }).click();
    await page.waitForFunction((header) => header.getBoundingClientRect().bottom < 0, menuHeader);
  });
});

test('selection follows visibility bounds without restarting surfaces and stays out of reader mode', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  for (const mode of ['editor', 'reader']) {
    await context.test(mode, async () => {
      const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
      context.after(() => page.close());
      await page.goto(`${origin}/tests/visualPlacement/?mode=${mode}`);
      await page.getByTestId('first').click();
      await page.getByTestId('page-one').waitFor();
      await page.waitForFunction(() => window.setVisualTestSelection);
      await setSurfaces(page, [item({
        placement: { ...fill('story'), size: { width: px(25), height: px(30) } },
        visibility: {},
      })]);
      let originalToken = await token(page);
      await page.evaluate(() => window.setVisualTestSelection('missing'));
      assert.equal(await page.locator('[data-visual-selection]').count(), 0);
      await page.evaluate(() => window.setVisualTestSelection('probe'));
      const outline = page.locator('[data-visual-selection="probe"]');
      if (mode === 'reader') {
        assert.equal(await outline.count(), 0);
        return;
      }
      await outline.waitFor();
      assert.deepEqual(await outline.boundingBox(), await visibility(page).boundingBox());
      assert.notDeepEqual(await outline.boundingBox(), await surface(page).boundingBox());
      assert.equal(await outline.evaluate((element) => getComputedStyle(element).pointerEvents), 'none');
      assert.equal(await outline.evaluate((element) => getComputedStyle(element).zIndex), '40');
      assert.equal(await token(page), originalToken);
      await page.setViewportSize({ width: 720, height: 650 });
      await page.waitForFunction(() => document.querySelector('[data-story-region="story"]').getBoundingClientRect().width === 672);
      await page.waitForFunction(() => {
        const outline = document.querySelector('[data-visual-selection]').getBoundingClientRect();
        const region = document.querySelector('[data-story-region="story"]').getBoundingClientRect();
        return outline.width === region.width && outline.height === region.height;
      });
      assert.deepEqual(await outline.boundingBox(), await visibility(page).boundingBox());
      await setSurfaces(page, [item({ placement: fill('narrativeContent') })]);
      await page.waitForFunction(() => document.querySelector('[data-visual-selection]').getBoundingClientRect().height < 650);
      originalToken = await token(page);
      const before = await outline.boundingBox();
      await page.locator('#narrative').evaluate((element) => { element.scrollTop = 100; });
      await page.waitForTimeout(50);
      const afterScroll = await outline.boundingBox();
      const viewport = await page.locator('[data-story-region="narrativeViewport"]').boundingBox();
      near(afterScroll.y, viewport.y, 'selection clips at the actual scrollport after content moves');
      assert(afterScroll.height <= viewport.height);
      await page.evaluate(() => window.setVisualTestSelection(null));
      await outline.waitFor({ state: 'detached' });
      assert.equal(await token(page), originalToken);
      await page.evaluate(() => window.setVisualTestSelection('probe'));
      await outline.waitFor();
      await setSurfaces(page, [item({ placement: fill('narrativeContent'), hidden: true })]);
      assert.equal(await outline.count(), 0);
      assert.equal(await token(page), originalToken);
      await setSurfaces(page, []);
      assert.equal(await page.locator('[data-visual-selection]').count(), 0);
    });
  }
});
