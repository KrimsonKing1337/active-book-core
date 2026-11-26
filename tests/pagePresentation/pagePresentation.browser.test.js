import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { openBrowserFixture } from '../browserFixture.js';

const hold = async (page, pattern, releaseRoute = (route) => route.continue()) => {
  let accept;
  let release;
  const requested = new Promise((resolve) => { accept = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route(pattern, async (route) => {
    accept();
    await gate;
    await releaseRoute(route);
  });
  return { requested, release };
};

const read = (page) => page.evaluate(() => window.presentationTest.read());

test('Suspense and real media prepare before reveal, autoplay and reader interaction', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  context.after(() => page.close());
  const image = await hold(page, '**/delayed-page.svg', (route) => route.fulfill({ status: 404 }));
  const audio = await hold(page, '**/tone.wav?presentation');
  const video = await hold(page, '**/movie.webm?presentation');
  context.after(() => [image, audio, video].forEach((resource) => resource.release()));

  await page.goto(`${origin}/tests/pagePresentation/`, { waitUntil: 'domcontentloaded' });
  const story = page.locator('[data-story-content]');
  const animation = page.getByTestId('animated-effect');
  const next = page.locator('[aria-label="Следующая страница"]');
  await page.waitForFunction(() => window.presentationTest?.read().showLoader);
  assert.equal((await read(page)).visit.primaryCommitted, false);
  assert.equal(await story.evaluate((node) => node.inert), true);
  assert.equal(await next.evaluate((node) => !!node.closest('[inert]')), true);
  assert.equal(await animation.evaluate((node) => getComputedStyle(node).animationPlayState), 'paused');

  await page.evaluate(() => window.presentationTest.resolvePrimary());
  await Promise.all([image.requested, audio.requested, video.requested]);
  const initial = await read(page);
  assert.equal(initial.isAudioUnlocked, false, 'preparation starts without a browser gesture');
  assert.equal(initial.visit.presentedAt, null);
  assert.equal(await page.getByRole('button', { name: 'Story action' }).count(), 0);
  assert.equal(await page.getByTestId('page-video').evaluate((node) => node.paused), true);
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' })));
  assert.equal((await read(page)).pageId, 'first');

  image.release();
  video.release();
  await page.waitForFunction(() => {
    const { visit } = window.presentationTest.read();
    return visit.failedResources === 1 && Object.keys(visit.pendingResources).length === 1;
  });
  assert.equal((await read(page)).visit.presentedAt, null);
  audio.release();
  await page.waitForFunction(() => {
    const { showLoader, visit } = window.presentationTest.read();
    return showLoader && !Object.keys(visit.pendingResources).length;
  });
  assert.equal((await read(page)).visit.presentedAt, null, 'Loader hide delay is part of preparation for display');

  await page.waitForFunction(() => window.presentationTest.read().timeline.some(({ event }) => event === 'video'));
  const afterReveal = await read(page);
  assert.equal(afterReveal.visit.id, initial.visit.id);
  assert.equal(afterReveal.timeline[0].event, 'presented');
  assert.equal(afterReveal.timeline[0].hidden, false);
  assert.equal(afterReveal.timeline[0].loader, false);
  assert(afterReveal.timeline[1].time >= afterReveal.visit.presentedAt);
  assert.equal(afterReveal.timeline.some(({ event }) => event === 'audio'), false);
  assert.equal(await animation.evaluate((node) => getComputedStyle(node).animationPlayState), 'running');

  await page.getByRole('button', { name: 'Story action' }).click();
  await page.waitForFunction(() => window.presentationTest.read().timeline.some(({ event }) => event === 'audio'));
  const afterUnlock = await read(page);
  assert.equal(afterUnlock.visit.presentedAt, afterReveal.visit.presentedAt);
  assert.equal(afterUnlock.timeline.filter(({ event }) => event === 'audio').length, 1);
  assert(afterUnlock.timeline.some(({ event }) => event === 'interaction'));

  await page.keyboard.press('ArrowRight');
  await page.getByText('Second story').waitFor();
  const nextVisit = (await read(page)).visit;
  assert(nextVisit.id > afterUnlock.visit.id);
  assert(nextVisit.presentedAt >= afterUnlock.visit.presentedAt);
});


test('dotLottie load errors settle their visit without starting playback', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  context.after(() => page.close());
  const wasm = fileURLToPath(new URL('../../node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm', import.meta.url));
  await page.route('**/vendors/dotlottie-player.wasm', (route) => route.fulfill({ path: wasm, contentType: 'application/wasm' }));
  await page.route('**/delayed-page.svg', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>',
  }));
  const animation = await hold(page, '**/broken-animation.json', (route) => route.fulfill({ status: 404 }));
  context.after(() => animation.release());

  await page.goto(`${origin}/tests/pagePresentation/?dotlottie`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.presentationTest);
  await page.evaluate(() => window.presentationTest.resolvePrimary());
  await animation.requested;
  assert.equal((await read(page)).visit.presentedAt, null);
  animation.release();
  await page.waitForFunction(() => window.presentationTest.read().visit.presentedAt !== null);
  const state = await read(page);
  assert.equal(state.visit.failedResources, 1);
  assert.equal(state.timeline.some(({ event }) => event === 'lottie'), false);
});


test('programmatic navigation cancels the prepared audio of the previous visit', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  context.after(() => page.close());
  const audio = await hold(page, '**/tone.wav?presentation');
  context.after(() => audio.release());
  await page.route('**/delayed-page.svg', (route) => route.fulfill({ status: 404 }));
  await page.goto(`${origin}/tests/pagePresentation/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.presentationTest);
  await page.evaluate(() => window.presentationTest.resolvePrimary());
  await audio.requested;
  await page.keyboard.press('ArrowRight');
  const cancelled = await read(page);
  assert.equal(cancelled.pageId, 'first');
  assert.equal(cancelled.visit.presentedAt, null);

  await page.evaluate(() => window.presentationTest.navigate(2));
  await page.waitForFunction(() => {
    const { visit, pageId } = window.presentationTest.read();
    return pageId === 'second' && visit.presentedAt !== null;
  });
  audio.release();
  await page.evaluate(() => window.presentationTest.navigate(1));
  await page.waitForFunction(() => window.presentationTest.read().timeline.some(({ event }) => event === 'audio'));
  const reopened = await read(page);
  assert(reopened.visit.id > cancelled.visit.id);
  assert.deepEqual(
    reopened.timeline.filter(({ event }) => event === 'presented').map(({ visitId }) => visitId),
    [cancelled.visit.id + 1, reopened.visit.id],
  );
  assert.equal(reopened.timeline.filter(({ event }) => event === 'audio').length, 1);
  assert(reopened.timeline.find(({ event }) => event === 'audio').time >= reopened.visit.presentedAt);
});
