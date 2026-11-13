import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  mouseDrag,
  openCarousel,
  selections,
  waitIndices,
} from './carouselFixture.js';

test('StrictMode initialization, callback updates and parent rerenders do not duplicate selection', async (context) => {
  const page = await openCarousel(context);
  assert.equal(await page.getByTestId('outside-active').textContent(), 'true');
  await page.evaluate(() => window.carouselFixture.rerender());
  await page.getByTestId('revision').filter({ hasText: '1' }).waitFor();
  assert.deepEqual(await selections(page), [{ index: 0, version: 0 }]);

  await page.evaluate(() => window.carouselFixture.changeCallback());
  await page.getByTestId('callback-version').filter({ hasText: '1' }).waitFor();
  assert.deepEqual(await selections(page), [{ index: 0, version: 0 }]);
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  await waitIndices(page, [0, 1]);
  assert.deepEqual(await selections(page), [{ index: 0, version: 0 }, { index: 1, version: 1 }]);
});

test('buttons, keyboard and real drag update activity without remounting children', async (context) => {
  const page = await openCarousel(context);
  const carousel = page.getByRole('region', { name: 'Карусель' });
  const first = await page.getByTestId('slide-a').elementHandle();
  await page.getByRole('button', { name: 'Count a: 0' }).click();
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  await waitIndices(page, [0, 1]);
  assert.equal(await page.getByTestId('slide-a').getAttribute('data-active'), 'false');
  assert.equal(await page.getByTestId('slide-b').getAttribute('data-active'), 'true');
  assert.equal(await page.getByTestId('slide-a').evaluate((node) => {
    const slide = node.closest('[data-carousel-slide]');

    return slide.inert && slide.getAttribute('aria-hidden') === 'true';
  }), true);

  await carousel.focus();
  await page.keyboard.press('ArrowLeft');
  await waitIndices(page, [
    0,
    1,
    0,
  ]);
  assert(await first.evaluate((node) => node === document.querySelector('[data-testid="slide-a"]')));
  await page.getByRole('button', { name: 'Count a: 1' }).waitFor();
  await mouseDrag(page, page.getByTestId('drag-a'));
  await waitIndices(page, [
    0,
    1,
    0,
    1,
  ]);
  assert.equal(await page.getByTestId('next-page').count(), 0);
});

test('descendant keyboard and drag remain independent; end buttons are disabled', async (context) => {
  const page = await openCarousel(context);
  await page.getByRole('textbox', { name: 'Input a' }).focus();
  await page.keyboard.press('ArrowRight');
  await mouseDrag(page, page.getByRole('textbox', { name: 'Input a' }));
  await mouseDrag(page, page.getByRole('button', { name: 'Count a: 0' }));
  await mouseDrag(page, page.getByRole('link', { name: 'Link a' }));
  await mouseDrag(page, page.getByLabel('Editable a'));
  assert.deepEqual(await selections(page), [{ index: 0, version: 0 }]);
  assert(await page.getByRole('button', { name: 'Предыдущий слайд' }).isDisabled());
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  await page.getByText('2 из 3', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  await page.getByText('3 из 3', { exact: true }).waitFor();
  assert(await page.getByRole('button', { name: 'Следующий слайд' }).isDisabled());
  assert.equal(await page.getByTestId('next-page').count(), 0);
});
