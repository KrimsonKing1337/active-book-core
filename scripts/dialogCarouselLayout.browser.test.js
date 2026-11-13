import assert from 'node:assert/strict';
import { test } from 'node:test';

import { near, pixels } from './browserFixture.js';
import {
  geometry,
  mode,
  next,
  openPresentation,
  settledSize,
} from './dialogCarouselFixture.js';

test('media fills the body, contain/cover changes pixels and default slides scroll', async (context) => {
  const page = await openPresentation(context);
  await settledSize(page, 0.8);
  let bounds = await geometry(page);
  assert.equal(bounds.horizontalOverflow, false);
  assert.equal(bounds.verticalOverflow, true);
  const active = page.getByRole('dialog').locator('[data-carousel-slide]:not([inert])');
  await active.hover();
  await page.mouse.wheel(0, 450);
  await page.waitForFunction(() => {
    const slide = document.querySelector('[role="dialog"] [data-carousel-slide]:not([inert])');

    return slide.scrollTop > 100;
  });
  await next(page);
  await mode(page, 'media');
  await page.getByRole('dialog').getByAltText('Portrait').first().waitFor();
  // Wait for the existing padding transition and Embla snap to finish, not a test-only style override.
  await page.waitForFunction(() => {
    const body = document.querySelector('[data-story-dialog-body]');

    return getComputedStyle(body).paddingLeft === '0px';
  });
  bounds = await geometry(page);
  near(bounds.carousel.height, bounds.body.height, 'carousel body height');
  near(bounds.media.width, bounds.slide.width, 'image element width');
  near(bounds.media.height, bounds.slide.height, 'image element height');
  assert.equal(bounds.fit, 'contain');
  assert.equal(bounds.horizontalOverflow, false);
  // Screenshot polling allows Embla's real animation to settle before sampling.
  await page.waitForFunction(() => {
    const slide = document.querySelector('[role="dialog"] [data-carousel-slide]:not([inert])');
    const carousel = document.querySelector('[role="dialog"] [data-book-carousel]');

    return Math.abs(slide.getBoundingClientRect().x - carousel.getBoundingClientRect().x) < 1;
  });
  bounds = await geometry(page);
  const center = { x: bounds.media.x + bounds.media.width / 2, y: bounds.media.y + bounds.media.height / 2 };
  const edge = { x: bounds.media.x + 10, y: center.y };
  await page.waitForFunction(() => {
    return document.querySelector('[role="dialog"] [data-carousel-slide]:not([inert]) img').complete;
  });
  let sample = await pixels(page);
  assert.deepEqual(sample(center.x, center.y), [
    0,
    200,
    80,
  ]);
  assert.notDeepEqual(sample(edge.x, edge.y), [
    0,
    200,
    80,
  ]);
  await page.getByRole('dialog').getByRole('button', { name: 'Заполнить область' }).click();
  assert.equal((await geometry(page)).fit, 'cover');
  sample = await pixels(page);
  assert.deepEqual(sample(edge.x, edge.y), [
    0,
    200,
    80,
  ]);
  await next(page);
  bounds = await geometry(page);
  assert.equal(bounds.fit, 'cover');
  near(bounds.media.height, bounds.slide.height, 'video height including native controls');
  assert(await page.getByTestId('presentation-video').evaluate((video) => video.controls));
  await next(page);
  await mode(page, 'default');
  bounds = await geometry(page);
  assert.equal(bounds.fit, 'fill');
  assert.equal(bounds.horizontalOverflow, false);
  near(bounds.media.height / bounds.media.width, 2.5, 'mixed image keeps its natural aspect ratio');
  await page.getByRole('dialog').getByRole('button', { name: 'Предыдущий слайд' }).waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  const pageCarousel = page.getByRole('region', { name: 'Карусель' });
  assert.equal(await pageCarousel.getAttribute('data-carousel-layout'), 'flow');
  assert((await pageCarousel.boundingBox()).height < 250);
  await pageCarousel.getByRole('button', { name: 'Следующий слайд' }).click();
  await pageCarousel.getByText('2 из 2', { exact: true }).waitFor();
});

test('small editor preview uses container percentages and never writes reader preferences', async (context) => {
  const page = await openPresentation(context, { search: 'preview', opener: 'Open preview' });
  await settledSize(page, 0.8);
  await next(page);
  await mode(page, 'media');
  await page.getByRole('button', { name: 'Заполнить область' }).click();
  await page.getByRole('button', { name: 'Развернуть окно' }).click();
  await settledSize(page, 1);
  const bounds = await geometry(page);
  near(bounds.dialog.x, bounds.container.x, 'preview fullscreen x');
  near(bounds.dialog.y, bounds.container.y, 'preview fullscreen y');
  assert.equal(bounds.container.width, 540);
  assert.equal(bounds.container.height, 430);
  assert.equal(bounds.horizontalOverflow, false);
  assert.equal(await page.evaluate(() => localStorage.getItem('active-book:dialog-preferences')), null);
  await page.getByRole('button', { name: 'Вернуть размер окна' }).click();
  await settledSize(page, 0.8);
});
