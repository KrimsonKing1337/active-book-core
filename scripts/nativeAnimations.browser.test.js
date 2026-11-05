import assert from 'node:assert/strict';
import { test } from 'node:test';

import { near, openBrowserFixture, pixels } from './browserFixture.js';

const settle = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const patch = async (page, patch) => {
  await page.evaluate((patch) => window.playground.change(patch), patch);
  await settle(page);
};
const run = (page, id, status = 'completed') => page.waitForFunction(({ id, status }) => window.playground.session.runs.read(id)?.status === status, { id, status });
const open = async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1560, height: 1100 } });
  context.after(() => page.close());
  await page.goto(`${origin}/tests/visualPlayground/?mode=reader`);
  await page.locator('[data-demo-effect="frame"]').waitFor();
  return page;
};

test('all artistic demos complete native runs and preserve late milestone waits', async (context) => {
  const page = await open(context);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [demo, last] of [['frame', 'frame'], ['darkness', 'darkness'], ['edges', 'edges'], ['smoke', 'smoke'], ['through', 'through'], ['collapse', 'reveal'], ['sequence', 'reveal'], ['single', 'single']]) {
    await patch(page, { demo, duration: 300 });
    await page.getByTestId('play').click();
    await run(page, last);
    const result = await page.evaluate(async (id) => {
      const runs = window.playground.session.runs;
      const current = runs.read(id);
      await runs.wait(current, { milestone: 'boundary-reached', signal: new AbortController().signal });
      return current.milestones;
    }, last);
    assert(result.includes('boundary-reached'), demo);
    assert.equal(await page.locator('[role="alert"]').count(), 0, demo);
  }
  assert.deepEqual(errors, []);
});

test('one advancing-darkness effect uses four phases, keeps completed phases paused and preserves identity', async (context) => {
  const page = await open(context);
  await patch(page, { demo: 'advancing', duration: 2400, color: '#000000', opacity: 1 });
  assert.equal(await page.evaluate(() => window.playground.session.getSnapshot().length), 1);
  assert.equal(await page.locator('[data-darkness-phase]').count(), 4);
  const viewport = await page.locator('[data-story-region="storyViewport"]').boundingBox();
  const app = await page.locator('[data-book-application]').boundingBox();
  const samplePoint = { x: viewport.x + viewport.width - 45, y: viewport.y + 45 };
  const originalSample = (await pixels(page))(samplePoint.x, samplePoint.y);
  await page.getByTestId('play').click();
  await page.waitForFunction(() => window.playground.session.runs.read('advancing')?.milestones.includes('outside-covered'));
  let sample = await pixels(page);
  assert.deepEqual(sample(app.x + 8, app.y + app.height / 2), [0, 0, 0], 'outside is dark');
  assert.deepEqual(sample(samplePoint.x, samplePoint.y), originalSample, 'viewport still occludes the underlay');
  await page.waitForFunction(() => window.playground.session.runs.read('advancing')?.milestones.includes('frame-covered'));
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await settle(page);
  await page.evaluate(() => {
    window.advancingProbe = [...document.querySelectorAll('[data-phase-ink]')].map((node) => ({ node, animation: node.getAnimations()[0], time: node.getAnimations()[0].currentTime }));
  });
  for (const number of [2, 4]) {
    await page.getByRole('button', { name: `Страница ${number}`, exact: true }).click();
    await settle(page);
    assert(await page.evaluate(() => window.advancingProbe.every(({ node, animation, time }) => node.isConnected && node.getAnimations()[0] === animation && animation.currentTime === time)));
  }
  await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
  assert.equal(await page.locator('[data-phase-ink="outside"]').evaluate((node) => getComputedStyle(node).opacity), '1', 'resuming never rewinds a finished phase');
  await run(page, 'advancing');
  const milestones = await page.evaluate(() => window.playground.session.runs.read('advancing').milestones);
  for (const phase of ['outside-covered', 'frame-covered', 'controls-covered', 'narrative-covered']) assert(milestones.includes(phase));
  sample = await pixels(page);
  assert.deepEqual(sample(samplePoint.x, samplePoint.y), [0, 0, 0], 'narrative is dark at the end');
  const toolbar = await page.locator('#Toolbar').boundingBox();
  assert.deepEqual(sample(toolbar.x + 20, toolbar.y + toolbar.height / 2), [0, 0, 0], 'controls are dark at the end');
  await page.getByRole('button', { name: 'Выйти из диапазона', exact: true }).click();
  await page.locator('[data-darkness-phase]').waitFor({ state: 'detached' });
  assert(await page.evaluate(() => window.advancingProbe.every(({ node, animation }) => !node.isConnected && animation.playState === 'idle')));
  await page.getByRole('button', { name: 'Страница 1', exact: true }).click();
  assert.equal(await page.locator('[data-darkness-phase]').count(), 4);
  assert(await page.evaluate(() => window.advancingProbe.every(({ node }) => ![...document.querySelectorAll('[data-phase-ink]')].includes(node))));
});

test('visual collapse keeps layout sizes and restores existing CSS on stop, range exit and book destroy', async (context) => {
  const page = await open(context);
  await patch(page, { demo: 'collapse', duration: 800 });
  const original = await page.locator('[data-story-region="storyViewport"]').evaluate((node) => {
    node.style.transform = 'rotate(3deg)';
    return { width: node.clientWidth, height: node.clientHeight, transform: node.style.transform };
  });
  await page.getByTestId('play').click();
  await run(page, 'collapse', 'running');
  await page.waitForFunction(() => document.querySelector('[data-story-region="storyViewport"]').getBoundingClientRect().width < 0.01);
  const actual = await page.locator('[data-story-region="storyViewport"]').evaluate((node) => ({ width: node.clientWidth, height: node.clientHeight, transform: node.style.transform }));
  assert.deepEqual(actual, original);
  assert.equal(await page.locator('[data-layout-mode]').count(), 0);
  await page.getByRole('button', { name: 'Стоп / сброс', exact: true }).click();
  assert.equal(await page.locator('[data-story-region="storyViewport"]').evaluate((node) => node.getAnimations().length), 0);
  assert.equal(await page.locator('[data-story-region="storyViewport"]').evaluate((node) => node.style.transform), original.transform);
  await page.getByTestId('play').click();
  await run(page, 'collapse', 'running');
  await page.getByRole('button', { name: 'Выйти из диапазона', exact: true }).click();
  assert.equal(await page.locator('[data-story-region="storyViewport"]').evaluate((node) => node.getAnimations().length), 0);
  near(await page.locator('[data-story-region="storyViewport"]').evaluate((node) => node.clientWidth), original.width, 'layout width');
  await page.evaluate(() => window.playground.setVisible(false));
  assert.equal(await page.locator('[data-demo-effect]').count(), 0);
});
