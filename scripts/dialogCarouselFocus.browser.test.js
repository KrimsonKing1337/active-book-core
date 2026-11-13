import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mouseDrag, touchSwipe } from './carouselFixture.js';
import {
  mode,
  next,
  openPresentation,
  selection,
} from './dialogCarouselFixture.js';

const activeSlide = (page) => page.getByRole('dialog').locator('[data-carousel-slide]:not([inert])');

const swipeBack = async (page) => {
  const box = await activeSlide(page).boundingBox();
  assert(box);
  const session = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width * 0.15, y: box.y + box.height / 2 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });

  for (let step = 1; step <= 5; step += 1) {
    point.x = box.x + box.width * (0.15 + step * 0.14);
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
  }

  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
};

test('mouse and keyboard navigation keep controls accessible and focus out of inert slides', async (context) => {
  const page = await openPresentation(context);
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').focus();
  await mouseDrag(page, activeSlide(page));
  await selection(page, 2);
  await mode(page, 'media');
  await dialog.getByRole('region').focus();
  await page.keyboard.press('ArrowRight');
  await selection(page, 3);
  await page.keyboard.press('ArrowRight');
  await selection(page, 4);
  await mode(page, 'default');
  assert(await page.evaluate(() => !document.activeElement.closest('[inert]')));
  await page.keyboard.press('ArrowLeft');
  await selection(page, 3);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.activeElement?.textContent === 'Open gallery');
});

test('touch selection recovers focused slide content and the disappearing media fit button', async (context) => {
  const page = await openPresentation(context, { page: { viewport: { width: 430, height: 840 }, hasTouch: true } });
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').focus();
  await touchSwipe(page, activeSlide(page));
  await selection(page, 2);
  await mode(page, 'media');
  assert(await dialog.getByRole('region').evaluate((element) => element === document.activeElement));
  await page.waitForFunction(() => {
    const slide = document.querySelector('[role="dialog"] [data-carousel-slide]:not([inert])');
    const carousel = document.querySelector('[role="dialog"] [data-book-carousel]');

    const body = document.querySelector('[data-story-dialog-body]');

    return getComputedStyle(body).paddingLeft === '0px'
      && Math.abs(slide.getBoundingClientRect().x - carousel.getBoundingClientRect().x) < 1;
  });
  await dialog.getByRole('button', { name: 'Заполнить область' }).focus();
  await swipeBack(page);
  await selection(page, 1);
  await mode(page, 'default');
  const fullscreen = dialog.getByRole('button', { name: 'Развернуть окно' });
  assert(await fullscreen.evaluate((element) => element === document.activeElement));
  assert(await page.evaluate(() => !document.activeElement.closest('[inert]')));
  await next(page);
  await selection(page, 2);
});
