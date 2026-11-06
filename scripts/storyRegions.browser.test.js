import assert from 'node:assert/strict';
import { test } from 'node:test';

import { near, openBrowserFixture, pixels, setSurfaces } from './browserFixture.js';

const regions = ['story', 'storyViewport', 'storyViewportFrame', 'narrativeFrame',
  'narrativeViewport', 'narrativeContent', 'toolbar', 'toolbarFrame'];
const box = (page, name) => page.locator(`[data-story-region="${name}"]`).boundingBox();
const open = async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  context.after(() => page.close());
  await page.goto(`${origin}/tests/visualPlacement/`);
  await page.getByTestId('first').click();
  await page.getByTestId('page-one').waitFor();
  return page;
};
const effect = (region, visibility = undefined, plane = 'aboveStoryControls') => ({
  id: 'final-region', background: '#ff0000', placement: { region }, visibility,
  depth: { plane },
});

test('all final regions have persistent native hosts and viewport frame includes the whole Toolbar', async (context) => {
  const page = await open(context);
  const nodes = await Promise.all(regions.map((region) => page.locator(`[data-story-region="${region}"]`).elementHandle()));
  const hosts = await page.locator('[data-visual-host]').elementHandles();
  assert.equal(hosts.length, regions.length);
  assert.deepEqual(await box(page, 'storyViewportFrame'), await box(page, 'storyViewport'));
  const frame = await box(page, 'toolbarFrame');
  const toolbar = await box(page, 'toolbar');
  assert(frame.height > toolbar.height);
  assert(toolbar.y > frame.y);
  for (const region of regions) {
    await setSurfaces(page, [effect(region)]);
    const actual = await page.locator('[data-visual-content="final-region"]').boundingBox();
    assert.deepEqual(actual, await box(page, region), region);
  }
  await page.getByTestId('second').click();
  await page.getByTestId('page-two').waitFor();
  for (let i = 0; i < regions.length; i++) {
    assert(await nodes[i].evaluate((node, region) => node === document.querySelector(`[data-story-region="${region}"]`), regions[i]));
  }
  assert(await Promise.all(hosts.map((host) => host.evaluate((node) => node.isConnected))).then((values) => values.every(Boolean)));
});

test('side masks are explicit, include the lower viewport edge and never alter layout padding', async (context) => {
  const page = await open(context);
  const bounds = await box(page, 'storyViewportFrame');
  const baseline = await page.locator('#narrative').evaluate((node) => getComputedStyle(node).padding);
  const toolbar = await box(page, 'toolbarFrame');
  for (const side of ['top', 'right', 'bottom', 'left']) {
    await setSurfaces(page, [effect('storyViewportFrame', { sides: [side], frameWidth: { value: 7, unit: 'px' } })]);
    const sample = await pixels(page);
    const points = {
      top: [bounds.x + bounds.width / 2, bounds.y + 3],
      right: [bounds.x + bounds.width - 3, bounds.y + bounds.height / 2],
      bottom: [bounds.x + bounds.width / 2, bounds.y + bounds.height - 3],
      left: [bounds.x + 3, bounds.y + bounds.height / 2],
    };
    for (const [name, point] of Object.entries(points)) {
      assert.equal(sample(...point).join(',') === '255,0,0', name === side, `${side}: ${name}`);
    }
  }
  await setSurfaces(page, [effect('storyViewportFrame', { sides: ['left'], frameWidth: { value: 25, unit: 'px' } })]);
  assert.deepEqual((await pixels(page))(bounds.x + 20, bounds.y + bounds.height / 2), [255, 0, 0]);
  assert.equal(await page.locator('#narrative').evaluate((node) => getComputedStyle(node).padding), baseline);
  assert.deepEqual(await box(page, 'toolbarFrame'), toolbar);
  await setSurfaces(page, [effect('storyViewportFrame')]);
  assert.deepEqual((await pixels(page))(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2), [255, 0, 0], 'no implicit frame mask');
});

test('toolbarFrame supports different mask widths on all four sides without changing padding', async (context) => {
  const page = await open(context);
  const region = await box(page, 'toolbarFrame');
  const beforePadding = await page.locator('[data-story-region="toolbarFrame"]').evaluate((node) => {
    return getComputedStyle(node).padding;
  });

  await setSurfaces(page, [effect('toolbarFrame', {
    sides: ['top', 'right', 'bottom', 'left'],
    frameWidth: {
      top: { value: 6, unit: 'px' },
      right: { value: 20, unit: 'px' },
      bottom: { value: 11, unit: 'px' },
      left: { value: 16, unit: 'px' },
    },
  })]);

  const screenshot = await pixels(page);
  const isRed = (x, y) => screenshot(x, y).join(',') === '255,0,0';
  const middleX = region.x + region.width / 2;
  const middleY = region.y + region.height / 2;

  assert(isRed(middleX, region.y + 3), 'top band');
  assert(!isRed(middleX, region.y + 9), 'outside top band');
  assert(isRed(region.x + region.width - 14, middleY), 'right band');
  assert(!isRed(region.x + region.width - 24, middleY), 'outside right band');
  assert(isRed(middleX, region.y + region.height - 8), 'bottom band');
  assert(!isRed(middleX, region.y + region.height - 14), 'outside bottom band');
  assert(isRed(region.x + 12, middleY), 'left band');
  assert(!isRed(region.x + 19, middleY), 'outside left band');

  assert.equal(await page.locator('[data-story-region="toolbarFrame"]').evaluate((node) => {
    return getComputedStyle(node).padding;
  }), beforePadding);
  assert.deepEqual(await box(page, 'toolbarFrame'), region);
});

test('Toolbar has natural wrapping height and local planes preserve control interaction', async (context) => {
  const page = await open(context);
  const button = page.locator('[data-welcome-tour-id="bookmarks"]');
  await button.evaluate((node) => { node.style.background = '#0000ff'; });
  const buttonBox = await button.boundingBox();
  const baseline = (await pixels(page))(buttonBox.x + 1, buttonBox.y + 1);
  for (const plane of ['belowNarrative', 'aboveNarrative', 'aboveStoryControls']) {
    await setSurfaces(page, [effect('toolbar', undefined, plane)]);
    const sample = await pixels(page);
    assert.deepEqual(sample(buttonBox.x + 1, buttonBox.y + 1), plane === 'aboveStoryControls' ? [255, 0, 0] : baseline, plane);
  }
  await button.click();
  await page.getByText('Закладки', { exact: true }).first().waitFor();
  await page.getByText('Закладки', { exact: true }).first().locator('..').getByRole('button', { name: 'Закрыть', exact: true }).click();
  await setSurfaces(page, []);
  const before = await box(page, 'toolbarFrame');
  const narrative = await box(page, 'narrativeFrame');
  await page.locator('#Toolbar').evaluate((node) => {
    for (let index = 0; index < 20; index++) {
      const button = document.createElement('button');
      button.textContent = `Extra ${index}`;
      button.style.padding = '12px';
      node.insertBefore(button, node.querySelector('[data-visual-host]'));
    }
  });
  const after = await box(page, 'toolbarFrame');
  assert(after.height > before.height);
  near((await box(page, 'narrativeFrame')).height, narrative.height - (after.height - before.height), 'remaining flex height');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 740 });
    const viewport = await box(page, 'storyViewport');
    const toolbar = await box(page, 'toolbarFrame');
    assert(toolbar.y + toolbar.height <= viewport.y + viewport.height + 1);
    assert((await box(page, 'narrativeFrame')).height >= 0);
  }
});


test('percentage mask widths follow each gradient axis when Toolbar wraps, independently of padding', async (context) => {
  const page = await open(context);
  const initial = await box(page, 'toolbarFrame');
  const sides = ['top', 'right', 'bottom', 'left'];
  const uniform = { value: 20, unit: '%' };
  const perSide = {
    top: { value: 10, unit: '%' },
    right: { value: 20, unit: '%' },
    bottom: { value: 30, unit: '%' },
    left: { value: 15, unit: '%' },
  };

  for (const wrapped of [false, true]) {
    if (wrapped) {
      await page.locator('#Toolbar').evaluate((node) => {
        for (let index = 0; index < 12; index++) {
          const button = document.createElement('button');
          button.textContent = `Extra ${index}`;
          button.style.width = '70px';
          node.insertBefore(button, node.querySelector('[data-visual-host]'));
        }
      });
      await page.setViewportSize({ width: 390, height: 740 });
      assert((await box(page, 'toolbarFrame')).height > initial.height);
    }

    const padding = await page.locator('#narrative').evaluate((node) => getComputedStyle(node).padding);
    const bounds = await box(page, 'toolbarFrame');
    for (const frameWidth of [uniform, perSide]) {
      await setSurfaces(page, [effect('toolbarFrame', { sides, frameWidth })]);
      const region = await box(page, 'toolbarFrame');
      assert.deepEqual(region, bounds, 'mask changes do not resize Toolbar');
      const sample = await pixels(page);
      const isRed = (x, y) => sample(x, y).join(',') === '255,0,0';
      const middleX = region.x + region.width / 2;
      const middleY = region.y + region.height / 2;
      const axes = {
        top: (distance) => [middleX, region.y + distance],
        right: (distance) => [region.x + region.width - distance, middleY],
        bottom: (distance) => [middleX, region.y + region.height - distance],
        left: (distance) => [region.x + distance, middleY],
      };
      for (const side of sides) {
        const percentage = 'value' in frameWidth ? frameWidth.value : frameWidth[side].value;
        const axisLength = side === 'top' || side === 'bottom' ? region.height : region.width;
        const thickness = axisLength * percentage / 100;
        assert(isRed(...axes[side](thickness / 2)), `${side}: inside ${percentage}% band`);
        assert(!isRed(...axes[side](thickness + 3)), `${side}: outside ${percentage}% band`);
      }
      assert(!isRed(middleX, middleY), 'add-composed side masks leave the center transparent');
      assert.equal(await page.locator('#narrative').evaluate((node) => getComputedStyle(node).padding), padding);
    }
  }
});
