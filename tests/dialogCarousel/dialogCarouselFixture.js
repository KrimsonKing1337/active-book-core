import assert from 'node:assert/strict';

import { openBrowserFixture } from '../browserFixture.js';

export const openPresentation = async (context, options = {}) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({
    viewport: { width: 1100, height: 850 },
    ...options.page,
  });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  context.after(async () => {
    await page.close();
    assert.deepEqual(errors, []);
  });
  await page.goto(`${origin}/tests/dialogCarousel/?${options.search ?? ''}`);
  await page.getByRole('button', { name: options.opener ?? 'Open gallery', exact: true }).click();
  await page.getByRole('dialog').waitFor();

  return page;
};

export const mode = async (page, expected) => {
  await page.waitForFunction((expected) => {
    return document.querySelector('[role="dialog"]')?.dataset.mode === expected;
  }, expected);
};

export const selection = async (page, number) => {
  await page.getByRole('dialog').getByText(`${number} из 4`, { exact: true }).waitFor();
};

export const next = async (page) => {
  await page.getByRole('dialog').getByRole('button', { name: 'Следующий слайд' }).click();
};

export const previous = async (page) => {
  await page.getByRole('dialog').getByRole('button', { name: 'Предыдущий слайд' }).click();
};

export const geometry = (page) => page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  const body = dialog.querySelector('[data-story-dialog-body]');
  const carousel = dialog.querySelector('[data-book-carousel]');
  const slide = carousel.querySelector('[data-carousel-slide]:not([inert])');
  const media = slide.querySelector('img, video');
  const viewport = dialog.closest('[data-story-region="storyViewport"]')
    ?? document.querySelector('[data-testid="preview"]');
  const box = (element) => {
    const rect = element.getBoundingClientRect();

    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  };

  return {
    dialog: box(dialog),
    container: box(viewport),
    body: box(body),
    carousel: box(carousel),
    slide: box(slide),
    media: media && box(media),
    fit: media && getComputedStyle(media).objectFit,
    horizontalOverflow: body.scrollWidth > body.clientWidth,
    verticalOverflow: slide.scrollHeight > slide.clientHeight,
  };
});

export const settledSize = async (page, ratio) => {
  await page.waitForFunction((ratio) => {
    const dialog = document.querySelector('[role="dialog"]');
    const container = dialog.closest('[data-story-region="storyViewport"]')
    ?? document.querySelector('[data-testid="preview"]');
    const rect = dialog.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();

    return Math.abs(rect.width - bounds.width * ratio) < 1 && Math.abs(rect.height - bounds.height * ratio) < 1;
  }, ratio);
};
