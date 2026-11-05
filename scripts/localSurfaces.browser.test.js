import assert from 'node:assert/strict';
import { test } from 'node:test';

import { near, openBrowserFixture, pixels, setSurfaces } from './browserFixture.js';

const px = (value) => ({ value, unit: 'px' });
const percent = (value) => ({ value, unit: '%' });
const fill = (region) => ({
  coordinates: region,
  anchor: { region, point: 'top-left' },
  origin: 'top-left',
  offset: { x: px(0), y: px(0) },
  size: { width: percent(100), height: percent(100) },
});
const item = (region, extra = {}) => ({
  id: 'local', layout: 'local', background: '#ff0000',
  placement: fill(region),
  visibility: region === 'frame' ? { region, sides: ['left', 'right'] } : { region },
  depth: { plane: 'aboveNarrative', order: 0 },
  ...extra,
});
const regionBox = (page, region) => page.locator(`[data-story-region="${region === 'frame' ? 'narrativeFrame' : region}"]`).boundingBox();
const surface = (page) => page.locator('[data-visual-content="local"]');

const open = async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  context.after(() => page.close());
  await page.goto(`${origin}/tests/visualPlacement/`);
  await page.getByTestId('first').click();
  await page.getByTestId('page-one').waitFor();
  return page;
};

test('native surfaces fill actual region boxes and preserve portal identity on layer changes', async (context) => {
  const page = await open(context);
  for (const region of ['story', 'storyViewport', 'narrativeFrame', 'frame', 'narrativeViewport', 'narrativeContent']) {
    await setSurfaces(page, [item(region)]);
    const expected = await regionBox(page, region);
    const actual = await surface(page).boundingBox();
    for (const key of ['x', 'y', 'width', 'height']) near(actual[key], expected[key], `${region} ${key}`);
    assert.equal(await page.locator('[data-visual-surface="local"]').evaluate((node) => {
      return node.parentElement.dataset.visualHost;
    }), region === 'frame' ? 'narrativeFrame' : region);
  }
  await setSurfaces(page, [item('storyViewport')]);
  const node = await page.locator('[data-probe="local"]').elementHandle();
  for (const plane of ['background', 'belowNarrative', 'aboveNarrative', 'aboveControls']) {
    await setSurfaces(page, [item('storyViewport', { depth: { plane, order: 20 } })]);
    assert(await node.evaluate((element) => element === document.querySelector('[data-probe="local"]')));
  }
});

test('all nine CSS anchors resolve mixed offsets and local sizes without a placement measurement', async (context) => {
  const page = await open(context);
  const anchors = {
    'top-left': [0, 0], top: [0.5, 0], 'top-right': [1, 0],
    left: [0, 0.5], center: [0.5, 0.5], right: [1, 0.5],
    'bottom-left': [0, 1], bottom: [0.5, 1], 'bottom-right': [1, 1],
  };
  for (const [point, [x, y]] of Object.entries(anchors)) {
    const placement = {
      ...fill('storyViewport'), anchor: { region: 'storyViewport', point }, origin: point,
      offset: { x: percent(5), y: px(-7) }, size: { width: px(60), height: px(40) },
    };
    await setSurfaces(page, [item('storyViewport', { placement })]);
    const region = await regionBox(page, 'storyViewport');
    const actual = await surface(page).boundingBox();
    near(actual.x, region.x + region.width * (x + 0.05) - 60 * x, `${point} x`);
    near(actual.y, region.y + region.height * y - 7 - 40 * y, `${point} y`);
    near(actual.width, 60, 'CSS width');
    near(actual.height, 40, 'CSS height');
  }
});

test('content surfaces scroll naturally while viewport overlays and hosts remain fixed', async (context) => {
  const page = await open(context);
  const content = item('narrativeContent');
  const viewport = { ...item('narrativeViewport'), id: 'fixed' };
  await setSurfaces(page, [content, viewport]);
  const before = await surface(page).boundingBox();
  const fixed = page.locator('[data-visual-content="fixed"]');
  const fixedBefore = await fixed.boundingBox();
  const contentNode = await surface(page).elementHandle();
  const fixedNode = await fixed.elementHandle();
  await page.locator('#narrative').evaluate((element) => { element.scrollTop = 150; });
  const after = await surface(page).boundingBox();
  near(after.y, before.y - 150, 'content follows real scroll');
  near((await fixed.boundingBox()).y, fixedBefore.y, 'fixed overlay');
  assert(await contentNode.evaluate((element) => element === document.querySelector('[data-visual-content="local"]')));
  assert(await fixedNode.evaluate((element) => element === document.querySelector('[data-visual-content="fixed"]')));
  await page.setViewportSize({ width: 700, height: 650 });
  const expected = await regionBox(page, 'narrativeViewport');
  const actual = await fixed.boundingBox();
  near(actual.width, expected.width, 'native responsive width');
  near(actual.height, expected.height, 'native responsive height');
});


test('default book application has one boundary, external underlay/overlay and protected selection', async (context) => {
  const page = await open(context);
  assert.equal(await page.locator('[data-book-application]').count(), 1);
  const app = await page.locator('[data-book-application]').boundingBox();
  const viewport = await regionBox(page, 'storyViewport');
  await setSurfaces(page, [item('application', { depth: { plane: 'background', order: 0 } })]);
  let sample = await pixels(page);
  assert.deepEqual(sample(app.x + 6, app.y + app.height / 2), [255, 0, 0], 'underlay outside the book');
  assert.notDeepEqual(sample(viewport.x + 80, viewport.y + 50), [255, 0, 0], 'opaque viewport naturally occludes underlay');
  await setSurfaces(page, [item('application', { depth: { plane: 'aboveControls', order: 0 } })]);
  sample = await pixels(page);
  const toolbar = await page.locator('#Toolbar').boundingBox();
  assert.deepEqual(sample(toolbar.x + 10, toolbar.y + 10), [255, 0, 0], 'external overlay covers controls');
  await page.evaluate(() => window.setVisualTestSelection('local'));
  await page.locator('[data-visual-selection="local"]').waitFor();
  const selection = await page.locator('[data-visual-selection="local"]').boundingBox();
  near(selection.width, app.width, 'selection measures the actual chosen application');
  near(selection.height, app.height, 'selection height');
  assert.equal(await page.locator('[data-visual-selection="local"]').evaluate((element) => {
    return element.parentElement.dataset.applicationHost;
  }), 'selection');
  await page.getByTestId('second').click();
  await page.getByTestId('page-two').waitFor();
});
