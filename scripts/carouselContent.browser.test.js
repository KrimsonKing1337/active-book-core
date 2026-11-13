import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  openCarousel,
  selections,
  waitIndices,
} from './carouselFixture.js';

test('adding and removing slides reinitializes Embla and reports index clamping once', async (context) => {
  const page = await openCarousel(context);
  await page.evaluate(() => window.carouselFixture.setSlides([
    'a',
    'b',
    'c',
    'd',
  ]));
  await page.getByText('1 из 4', { exact: true }).waitFor();
  assert.deepEqual(await selections(page), [{ index: 0, version: 0 }]);

  for (let index = 1; index <= 3; index += 1) {
    await page.getByRole('button', { name: 'Следующий слайд' }).click();
    await page.getByText(`${index + 1} из 4`, { exact: true }).waitFor();
  }

  await page.evaluate(() => window.carouselFixture.setSlides([
    'a',
    'b',
    'c',
  ]));
  await waitIndices(page, [
    0,
    1,
    2,
    3,
    2,
  ]);
  await page.getByText('3 из 3', { exact: true }).waitFor();
  assert.equal(await page.getByTestId('slide-c').getAttribute('data-active'), 'true');
  assert(await page.getByRole('button', { name: 'Следующий слайд' }).isDisabled());

  await page.evaluate(() => window.carouselFixture.setSlides(['b', 'c']));
  await waitIndices(page, [
    0,
    1,
    2,
    3,
    2,
    1,
  ]);
  await page.getByText('2 из 2', { exact: true }).waitFor();
});

test('keyed reorder and removal before selection keep child identity and numeric selection', async (context) => {
  const page = await openCarousel(context);
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  await page.getByRole('button', { name: 'Count b: 0' }).click();
  const original = await page.getByTestId('slide-b').elementHandle();
  await page.evaluate(() => window.carouselFixture.setSlides([
    'c',
    'a',
    'b',
  ]));
  await page.waitForFunction(() => {
    return document.querySelector('[data-testid="slide-a"]').getAttribute('data-active') === 'true';
  });
  assert(await original.evaluate((node) => node === document.querySelector('[data-testid="slide-b"]')));
  assert.match(await page.getByTestId('slide-b').textContent(), /Count b: 1/);
  await page.evaluate(() => window.carouselFixture.setSlides(['a', 'b']));
  await page.getByText('2 из 2', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Count b: 1' }).waitFor();
  await waitIndices(page, [0, 1]);
});

test('resize and array recreation preserve selection without notifications', async (context) => {
  const page = await openCarousel(context);
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  const original = await page.getByTestId('slide-b').elementHandle();
  await page.evaluate(() => {
    window.carouselFixture.setWidth(300);
    window.carouselFixture.rerender();
    window.carouselFixture.setSlides([
      'a',
      'b',
      'c',
    ]);
  });
  await page.waitForFunction(() => {
    return document.querySelector('[data-carousel-slide]').getBoundingClientRect().width < 300;
  });
  await page.getByText('2 из 3', { exact: true }).waitFor();
  assert(await original.evaluate((node) => node === document.querySelector('[data-testid="slide-b"]')));
  assert.deepEqual(await selections(page), [{ index: 0, version: 0 }, { index: 1, version: 0 }]);
  await page.getByRole('button', { name: 'Следующий слайд' }).click();
  await waitIndices(page, [
    0,
    1,
    2,
  ]);
});

test('empty slides hide the carousel and repopulating reports a fresh initial selection', async (context) => {
  const page = await openCarousel(context);
  await page.evaluate(() => window.carouselFixture.setSlides([]));
  await page.getByRole('region', { name: 'Карусель' }).waitFor({ state: 'detached' });
  assert.equal(await page.getByRole('button', { name: 'Следующий слайд' }).count(), 0);
  assert.equal(await page.getByText('1 из 0', { exact: true }).count(), 0);
  assert.deepEqual(await selections(page), [{ index: 0, version: 0 }]);
  await page.evaluate(() => window.carouselFixture.setSlides(['a']));
  await waitIndices(page, [0, 0]);
  await page.getByText('1 из 1', { exact: true }).waitFor();
  assert(await page.getByRole('button', { name: 'Предыдущий слайд' }).isDisabled());
  assert(await page.getByRole('button', { name: 'Следующий слайд' }).isDisabled());
});
