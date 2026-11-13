import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openDialogs, travel, waitPosition } from './readerDialogsFixture.js';

const prefsKey = 'active-book:dialog-preferences';

test('real text, author and EasterEgg triggers use Radix, keyboard focus and native History', async (context) => {
  const { page } = await openDialogs(context);
  const initialLength = await page.evaluate(() => history.length);
  assert.equal(await page.locator('video').count(), 0, 'inactive dialog media is not mounted');
  for (const title of ['Видео A', 'Комментарий автора', 'Секрет']) {
    const trigger = page.getByRole('button', { name: title, exact: true });
    await trigger.focus();
    await trigger.press('Enter');
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await dialog.waitFor();
    assert.equal(await page.getByRole('dialog').count(), 1);
    await page.keyboard.press('Tab');
    assert.ok(await dialog.evaluate((node) => node.contains(document.activeElement)));
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    await page.waitForFunction((title) => {
      return document.activeElement?.textContent.trim() === title;
    }, title);
    await waitPosition(page, 'base');
  }
  assert.equal(await page.evaluate(() => history.length), initialLength + 1);
  await page.getByRole('button', { name: 'Видео A', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  await travel(page, -1);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await travel(page, 1);
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.equal(await page.evaluate(() => window.readDialogState().windows.activeWindow), null);
});

test('replacement pauses/reset video A, plays B and never returns focus into the retired dialog', async (context) => {
  const { page } = await openDialogs(context);
  await page.getByRole('button', { name: 'Видео A', exact: true }).click();
  const first = page.getByRole('dialog', { name: 'Видео A', exact: true });
  const oldVideo = await first.locator('video').elementHandle();
  assert.ok(oldVideo);
  await page.waitForFunction((video) => !video.paused && video.currentTime > 0.2, oldVideo);
  const length = await page.evaluate(() => history.length);
  await first.getByRole('button', { name: 'Заменить на видео B' }).click();
  const second = page.getByRole('dialog', { name: 'Видео B', exact: true });
  await second.waitFor();
  assert.equal(await page.getByRole('dialog').count(), 1);
  assert.ok(await oldVideo.evaluate((video) => video.paused && video.currentTime === 0));
  await page.waitForFunction(() => {
    const video = document.querySelector('[role="dialog"] video');
    return video && !video.paused && video.currentTime > 0.2;
  });
  await page.waitForFunction(() => document.querySelector('[role="dialog"]').contains(document.activeElement));
  assert.equal(await page.evaluate(() => history.length), length);
  const currentVideo = await second.locator('video').elementHandle();
  await page.keyboard.press('Escape');
  await second.waitFor({ state: 'detached' });
  assert.ok(await currentVideo.evaluate((video) => video.paused && video.currentTime === 0));
  await page.waitForFunction(() => document.activeElement === document.querySelector('#story-viewport'));
  await waitPosition(page, 'base');
  await page.getByRole('button', { name: 'Видео A', exact: true }).click();
  await page.waitForFunction(() => {
    const video = document.querySelector('[role="dialog"] video');
    return video && !video.paused && video.currentTime < 1;
  });
});

test('hidden trigger, real owner unmount and page navigation use viewport fallback', async (context) => {
  const { page } = await openDialogs(context);
  await page.getByRole('button', { name: 'Видео A', exact: true }).click();
  await page.getByRole('button', { name: 'Скрыть исходный триггер' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.activeElement === document.querySelector('#story-viewport'));
  await waitPosition(page, 'base');
  await page.reload();
  await page.getByRole('button', { name: 'Видео A', exact: true }).click();
  await page.getByRole('button', { name: 'Удалить владельца окна' }).click();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.waitForFunction(() => window.readDialogState().windows.activeWindow === null);
  await page.waitForFunction(() => document.activeElement === document.querySelector('#story-viewport'));
  await waitPosition(page, 'base');
  await page.reload();
  await page.getByRole('button', { name: 'Видео A', exact: true }).click();
  await page.getByRole('button', { name: 'Перейти со страницы окна' }).click();
  await page.getByTestId('second-page').waitFor();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await waitPosition(page, 'base');
  assert.equal(await page.evaluate(() => window.readDialogState().windows.activeWindow), null);
});

test('mobile media controls share reader preferences; preview writes neither preferences nor History', async (context) => {
  const { page, origin } = await openDialogs(context, { page: { viewport: { width: 390, height: 740 }, hasTouch: true } });
  await page.getByRole('button', { name: 'Видео A', exact: true }).click();
  await page.getByRole('button', { name: 'Развернуть окно', exact: true }).tap();
  await page.getByRole('button', { name: 'Заполнить область', exact: true }).tap();
  await page.keyboard.press('Escape');
  await waitPosition(page, 'base');
  await page.getByRole('button', { name: 'Секрет', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Секрет', exact: true });
  assert.equal(await dialog.getAttribute('data-fullscreen'), 'true');
  assert.equal(await dialog.getAttribute('data-object-fit'), 'cover');
  assert.equal(await dialog.locator('img').evaluate((image) => getComputedStyle(image).objectFit), 'cover');
  const saved = await page.evaluate((key) => localStorage.getItem(key), prefsKey);
  await page.goto(`${origin}/tests/readerDialogs/?mode=editor`);
  const length = await page.evaluate(() => history.length);
  await page.getByRole('button', { name: 'Видео A', exact: true }).click();
  assert.equal(await page.getByRole('dialog').count(), 0, 'preview does not claim reader ownership');
  assert.equal(await page.evaluate(() => history.length), length);
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.goto(`${origin}/tests/storyDialog/?mode=editor`);
  await page.getByRole('button', { name: 'Открыть окно', exact: true }).click();
  await page.getByRole('button', { name: 'Развернуть окно', exact: true }).click();
  await page.getByRole('button', { name: 'Заполнить область', exact: true }).click();
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), prefsKey), saved);
});
