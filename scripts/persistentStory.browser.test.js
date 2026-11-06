import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openBrowserFixture } from './browserFixture.js';

const settle = (page) => page.evaluate(() => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(resolve));
}));
const go = async (page, number) => {
  const name = number === 3 ? 'Выйти из диапазона' : `Страница ${number}`;
  await page.getByRole('button', { name, exact: true }).click();
  await page.locator(`[data-playground-page="${number}"]`).waitFor();
  await settle(page);
};
const dispatch = (page, type, payload) => page.evaluate(async ({ type, payload }) => {
  const { store } = await import('/src/store/index.ts');
  store.dispatch({ type, payload });
}, { type, payload });
const activeWindow = (page) => page.evaluate(async () => {
  const { store } = await import('/src/store/index.ts');
  const { main, bookmarks } = store.getState();
  return bookmarks.isOpen ? 'bookmarks' : main.menuActiveState;
});
const waitWindow = (page, windowId) => page.waitForFunction(async (windowId) => {
  const { store } = await import('/src/store/index.ts');
  const { main, bookmarks } = store.getState();
  const current = bookmarks.isOpen ? 'bookmarks' : main.menuActiveState;
  return current === windowId;
}, windowId);

for (const mode of ['reader', 'editor']) {
  test(`persistent real regions, local WAAPI and page cleanup in ${mode}`, async (context) => {
    const { browser, origin } = await openBrowserFixture(context);
    const page = await browser.newPage({ viewport: { width: 1560, height: 1100 } });
    context.after(() => page.close());
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${origin}/tests/visualPlayground/?mode=${mode}`);
    await page.locator('[data-demo-effect="frame"]').waitFor();
    await page.evaluate(() => window.playground.change({ demo: 'ball' }));
    await page.locator('[data-ball="range-ball"]').waitFor();
    const originalUrl = page.url();
    const historyLength = await page.evaluate(() => history.length);
    await page.evaluate(() => {
      const query = (region) => document.querySelector(`[data-story-region="${region}"]`);
      const range = document.querySelector('[data-ball="range-ball"]');
      const pageBall = document.querySelector('[data-ball="page-ball"]');
      window.identityProbe = {
        root: query('story'), shell: document.querySelector('#story-shell'), content: query('narrativeContent'),
        viewportFrame: query('storyViewportFrame'), toolbarFrame: query('toolbarFrame'),
        viewport: query('storyViewport'), narrative: query('narrativeViewport'),
        scroll: document.querySelector('#narrative'),
        regionHosts: [...document.querySelectorAll('[data-visual-host]')],
        frame: query('narrativeFrame'), toolbar: document.querySelector('#Toolbar'),
        range, pageBall, localHost: range.parentElement,
        animation: range.getAnimations()[0], pageAnimation: pageBall.getAnimations()[0],
        time: range.getAnimations()[0].currentTime,
      };
      document.querySelector('#narrative').scrollTop = 320;
    });
    await dispatch(page, '@segments/setSegmentsCount', 17);
    await go(page, 2);
    assert.equal(await page.locator('#narrative').evaluate((element) => element.scrollTop), 0);
    assert.equal(await page.evaluate(async () => {
      const { store } = await import('/src/store/index.ts');
      return store.getState().segments.count;
    }), 0, 'page boundary resets segments');
    await page.waitForFunction(() => window.identityProbe.animation.currentTime > window.identityProbe.time + 50);
    for (const number of [2, 4]) {
      await page.evaluate(() => { window.identityProbe.time = window.identityProbe.animation.currentTime; });
      await go(page, number);
      const result = await page.evaluate(() => {
        const old = window.identityProbe;
        const query = (region) => document.querySelector(`[data-story-region="${region}"]`);
        const range = document.querySelector('[data-ball="range-ball"]');
        return {
          root: old.root === query('story'), shell: old.shell === document.querySelector('#story-shell'),
          content: old.content === query('narrativeContent'), viewportFrame: old.viewportFrame === query('storyViewportFrame'),
          toolbarFrame: old.toolbarFrame === query('toolbarFrame'),
          viewport: old.viewport === query('storyViewport'), narrative: old.narrative === query('narrativeViewport'),
          scroll: old.scroll === document.querySelector('#narrative'),
          regionHosts: old.regionHosts.length === 8 && old.regionHosts.every((host) => {
            return host === document.querySelector(`[data-visual-host="${host.dataset.visualHost}"]`);
          }),
          frame: old.frame === query('narrativeFrame'), toolbar: old.toolbar === document.querySelector('#Toolbar'),
          host: old.localHost === range.parentElement, ball: old.range === range,
          animation: old.animation === range.getAnimations()[0],
          progressed: old.animation.currentTime >= old.time,
          pageRemoved: !old.pageBall.isConnected && old.pageAnimation.playState === 'idle',
        };
      });
      assert(Object.values(result).every(Boolean), JSON.stringify(result));
    }
    assert.equal(page.url(), originalUrl);
    assert.equal(await page.evaluate(() => history.length), historyLength);
    await go(page, 3);
    assert.equal(await page.locator('[data-ball]').count(), 0);
    assert.equal(await page.evaluate(() => {
      const old = window.identityProbe;
      return !old.range.isConnected && old.animation.playState === 'idle' && old.animation.currentTime === null;
    }), true);
    await go(page, 1);
    assert.equal(await page.evaluate(() => {
      const old = window.identityProbe;
      const current = document.querySelector('[data-ball="range-ball"]');
      return current !== old.range && current.getAnimations()[0] !== old.animation;
    }), true);
    await page.getByTestId('content-next').focus();
    await page.getByTestId('content-next').press('Enter');
    await page.locator('[data-playground-page="2"]').waitFor();
    if (mode === 'reader') {
      assert.equal(await page.locator('#narrative').evaluate((element) => document.activeElement === element), true);
      await page.locator('#narrative').press('ArrowLeft');
      await page.locator('[data-playground-page="1"]').waitFor();
    }
    await go(page, 2);
    const previousButton = page.getByRole('button', { name: 'Предыдущая страница', exact: true });
    await previousButton.click();
    await page.locator('[data-playground-page="1"]').waitFor();
    assert.equal(await previousButton.evaluate((element) => document.activeElement === element), true,
      'persistent Toolbar keeps focus during navigation');
    await page.evaluate(() => {
      const ball = document.querySelector('[data-ball="range-ball"]');
      window.finalProbe = { ball, animation: ball.getAnimations()[0] };
      window.playground.setVisible(false);
    });
    await page.locator('[data-story-region="story"]').waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => !window.finalProbe.ball.isConnected
      && window.finalProbe.animation.playState === 'idle'), true);
    await page.evaluate(() => window.playground.setVisible(true));
    await page.locator('[data-ball="range-ball"]').waitFor();
    assert.equal(await page.evaluate(() => document.querySelector('[data-ball="range-ball"]') !== window.finalProbe.ball), true);
    assert.deepEqual(errors, []);
  });
}

test('book windows use one same-URL history entry and release browser Back', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1560, height: 1100 } });
  context.after(() => page.close());
  await page.goto(`${origin}/tests/visualPlayground/?mode=reader`);
  await page.locator('[data-demo-effect="frame"]').waitFor();
  await page.evaluate(() => {
    history.replaceState({ external: 'before-book' }, '', '#before-book');
    history.pushState({ hostApplication: 'kept' }, '', location.pathname + location.search);
  });
  const url = page.url();
  const initialLength = await page.evaluate(() => history.length);
  await dispatch(page, '@main/setMenuActiveState', 'menu');
  await waitWindow(page, 'menu');
  assert.equal(page.url(), url);
  assert.equal(await page.evaluate(() => history.length), initialLength + 1);
  assert.equal(await page.evaluate(() => history.state.hostApplication), 'kept');
  await dispatch(page, '@main/setMenuActiveState', 'tableOfContents');
  await waitWindow(page, 'tableOfContents');
  await dispatch(page, '@bookmarks/setIsOpen', true);
  await waitWindow(page, 'bookmarks');
  assert.equal(await page.evaluate(() => history.length), initialLength + 1, 'switching replaces');
  await page.goBack();
  await waitWindow(page, null);
  await page.goForward();
  await waitWindow(page, 'bookmarks');
  await page.locator('#bookmarks').getByText('Закрыть', { exact: true }).click();
  await waitWindow(page, null);
  await page.waitForFunction(() => history.state?.hostApplication === 'kept' && !history.state.activeBookWindow);
  // Forward across an explicitly dismissed window stays closed.
  await page.goForward();
  assert.equal(await activeWindow(page), null);
  await page.goBack();
  await dispatch(page, '@main/setMenuActiveState', 'menu');
  await waitWindow(page, 'menu');
  await page.keyboard.press('Escape');
  await waitWindow(page, null);
  await page.waitForFunction(() => !history.state?.activeBookWindow);
  await page.goBack();
  assert.equal(new URL(page.url()).hash, '#before-book', 'Back is no longer trapped by book windows or pages');
  await page.goForward();
  assert.equal(await activeWindow(page), null);
  assert.equal(page.url(), url);
});


test('new tab, reload and actual book unmount keep window state and history aligned', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1560, height: 1100 } });
  context.after(() => page.close());
  await page.goto(`${origin}/tests/visualPlayground/?mode=reader`);
  await page.locator('[data-demo-effect="frame"]').waitFor();
  const initialLength = await page.evaluate(() => history.length);
  await dispatch(page, '@main/setMenuActiveState', 'menu');
  await waitWindow(page, 'menu');
  await page.reload();
  await page.locator('[data-demo-effect="frame"]').waitFor();
  await waitWindow(page, 'menu');
  assert.equal(await page.evaluate(() => history.length), initialLength + 1, 'reload adopts one existing entry');
  await page.goBack();
  await waitWindow(page, null);
  await page.goForward();
  await waitWindow(page, 'menu');
  await page.evaluate(() => window.playground.setVisible(false));
  await page.locator('[data-story-region="story"]').waitFor({ state: 'detached' });
  await waitWindow(page, null);
  await page.waitForFunction(() => !history.state?.activeBookWindow);
  await page.evaluate(() => window.playground.setVisible(true));
  await page.locator('[data-story-region="story"]').waitFor();
  assert.equal(await activeWindow(page), null);
  assert.equal(await page.evaluate(() => history.length), initialLength + 1, 'book mount does not push history');
});

test('TOC, bookmarks and informational Modal navigate and consume the same-URL history', async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1560, height: 1100 } });
  context.after(() => page.close());
  await page.goto(`${origin}/tests/visualPlayground/?mode=reader`);
  await page.locator('[data-demo-effect="frame"]').waitFor();
  const url = page.url();
  await dispatch(page, '@main/setTableOfContents', [{ title: 'Лес после дождя', pageNumber: 4 }]);
  await dispatch(page, '@main/setMenuActiveState', 'menu');
  await page.getByRole('button', { name: 'Оглавление', exact: true }).click();
  await waitWindow(page, 'tableOfContents');
  await page.locator('#table-of-contents').getByText('Лес после дождя', { exact: true }).click();
  await page.locator('[data-playground-page="4"]').waitFor();
  await page.goBack();
  await waitWindow(page, null);
  await dispatch(page, '@bookmarks/setBookmarks', [2]);
  await page.locator('[data-welcome-tour-id="bookmarks"]').click();
  await waitWindow(page, 'bookmarks');
  await page.locator('#bookmarks').getByText('Страница 2', { exact: true }).click();
  await page.locator('[data-playground-page="2"]').waitFor();
  await page.goBack();
  await waitWindow(page, null);
  await go(page, 1);
  await page.getByRole('button', { name: 'Следующая страница', exact: true }).click();
  const openModal = page.locator('[data-book-window-open="true"]').filter({ hasText: 'Вы можете использовать свайпы' });
  await openModal.waitFor();
  await page.goBack();
  await openModal.waitFor({ state: 'detached' });
  await page.locator('[data-playground-page="1"]').waitFor();
  await page.goForward();
  await openModal.waitFor();
  await openModal.getByRole('button', { name: 'Хорошо', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await openModal.waitFor({ state: 'detached' });
  await page.waitForFunction(() => !history.state?.activeBookWindow);
  assert.equal(page.url(), url);
});
