import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openBrowserFixture } from './browserFixture.js';

const openFixture = async (context) => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  context.after(() => page.close());
  await page.goto(`${origin}/tests/storyWindows/`);
  await page.getByTestId('open-a').waitFor();
  await page.evaluate(() => {
    history.replaceState({ external: { route: 7 } }, '');
    window.popCount = 0;
    addEventListener('popstate', () => { window.popCount += 1; });
  });
  return { page, origin };
};
const travel = (page, delta) => page.evaluate((delta) => new Promise((resolve) => {
  addEventListener('popstate', () => resolve(), { once: true });
  history.go(delta);
}), delta);
const waitPosition = (page, position) => page.waitForFunction((position) => {
  return history.state?.activeBookWindows?.position === position;
}, position);
const settle = (page) => page.evaluate(() => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(resolve));
}));
const active = (page) => page.evaluate(() => window.windowFixture.getState().activeWindow);

test('one Base/Guard pair for A → B → C; Forward stays inert across repeated traversals', async (context) => {
  const { page } = await openFixture(context);
  const initialLength = await page.evaluate(() => history.length);
  const url = page.url();
  await page.getByTestId('open-a').click();
  const firstMarker = await page.evaluate(() => history.state.activeBookWindows);
  assert.equal(firstMarker.position, 'guard');
  for (const id of ['B', 'C']) {
    await page.evaluate((id) => window.windowFixture.open(id), id);
    await page.getByRole('dialog', { name: `Окно ${id}`, exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => history.state.activeBookWindows), firstMarker);
  }
  assert.equal(await page.evaluate(() => history.length), initialLength + 1);
  assert.equal(page.url(), url);
  assert.deepEqual(await page.evaluate(() => history.state.external), { route: 7 });
  assert.deepEqual(Object.keys(firstMarker).sort(), ['pairId', 'position', 'sessionId', 'version']);
  await travel(page, -1);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  assert.equal(await active(page), null);
  assert.deepEqual(await page.evaluate(() => history.state.external), { route: 7 });
  for (let index = 0; index < 3; index += 1) {
    await travel(page, 1);
    await waitPosition(page, 'guard');
    // Unrelated Redux traffic must not turn a closed Forward guard into an automatic Back.
    await page.evaluate(() => window.windowFixture.go('unknown-page'));
    await settle(page);
    assert.equal(await active(page), null);
    assert.equal(await page.evaluate(() => history.state.activeBookWindows.position), 'guard');
    await travel(page, -1);
    await waitPosition(page, 'base');
  }
  assert.equal(await page.evaluate(() => window.popCount), 7, 'no compensating traversal for closed windows');
  assert.equal(await page.evaluate(() => history.length), initialLength + 1);
});

test('close button and Escape consume Guard; reopen during pending Back survives stale callbacks', async (context) => {
  const { page } = await openFixture(context);
  await page.getByTestId('open-a').click();
  await page.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
  await waitPosition(page, 'base');
  await page.evaluate(() => window.windowFixture.open('A'));
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  await waitPosition(page, 'base');
  const newId = await page.evaluate(() => {
    const previous = window.windowFixture.open('old');
    window.windowFixture.captureCallbacks();
    window.windowFixture.requestClose(previous);
    return window.windowFixture.open('successor');
  });
  await page.getByRole('dialog', { name: 'Окно successor', exact: true }).waitFor();
  await waitPosition(page, 'guard');
  await settle(page);
  await page.evaluate(() => {
    window.windowFixture.lateClose();
    window.windowFixture.lateForceClose();
  });
  assert.equal((await active(page)).instanceId, newId);
  assert.equal(await page.evaluate(() => window.popCount), 3, 'the pending old Back completed exactly once');
  await travel(page, -1);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
});

test('locked Back compensates within its pair without pushes and permits replacement', async (context) => {
  const { page } = await openFixture(context);
  await page.evaluate(() => window.windowFixture.open('locked', false));
  await page.getByRole('dialog').waitFor();
  const length = await page.evaluate(() => history.length);
  const marker = await page.evaluate(() => history.state.activeBookWindows);
  for (let index = 0; index < 4; index += 1) {
    await travel(page, -1);
    await waitPosition(page, 'guard');
    assert.equal((await active(page)).contentId, 'locked');
    assert.equal(await page.evaluate(() => history.length), length);
    assert.deepEqual(await page.evaluate(() => history.state.activeBookWindows), marker);
  }
  assert.equal(await page.evaluate(() => window.popCount), 8);
  await page.evaluate(() => window.windowFixture.open('replacement'));
  await page.getByRole('dialog', { name: 'Окно replacement' }).waitFor();
  assert.equal(await page.evaluate(() => history.length), length);
  await travel(page, -1);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
});

test('page change, unmount during traversal, recreation and reload do not restore windows', async (context) => {
  const { page } = await openFixture(context);
  await page.getByTestId('open-a').click();
  await page.evaluate(() => window.windowFixture.go('page-b'));
  await page.getByTestId('page-b').waitFor();
  await waitPosition(page, 'base');
  assert.equal(await active(page), null);
  await page.evaluate(() => {
    const old = window.windowFixture.open('old');
    window.windowFixture.requestClose(old);
    window.windowFixture.setVisible(false);
  });
  await page.locator('#story-shell').waitFor({ state: 'detached' });
  await waitPosition(page, 'base');
  await page.evaluate(() => window.windowFixture.setVisible(true));
  await page.getByTestId('open-a').waitFor();
  await page.getByTestId('open-a').click();
  await waitPosition(page, 'guard');
  const session = await page.evaluate(() => window.windowFixture.getState().sessionId);
  await page.evaluate(() => {
    const id = window.windowFixture.getState().activeWindow.instanceId;
    window.windowFixture.requestClose(id);
    window.windowFixture.renew();
  });
  await page.waitForFunction((owner) => window.windowFixture.getState().sessionId !== owner, session);
  await page.getByTestId('open-a').click();
  await page.getByRole('dialog').waitFor();
  await waitPosition(page, 'guard');
  await settle(page);
  assert.equal((await active(page)).contentId, 'A');
  await page.reload();
  await page.getByTestId('open-a').waitFor();
  assert.equal(await active(page), null);
  await travel(page, -1);
  await travel(page, 1);
  assert.equal(await active(page), null);
});

test('history-menu jump beyond the known pair is not compensated for a locked window', async (context) => {
  const { page } = await openFixture(context);
  await page.evaluate(() => {
    history.replaceState({ host: 'before-base' }, '', '#outside-pair');
    history.pushState({ host: 'reader-base' }, '', location.pathname);
    window.windowFixture.open('locked', false);
  });
  const length = await page.evaluate(() => history.length);
  await travel(page, -2);
  await settle(page);
  assert.equal(new URL(page.url()).hash, '#outside-pair');
  assert.equal(await page.evaluate(() => history.length), length);
  assert.equal(await page.evaluate(() => window.popCount), 1, 'no guessed go(1) outside the known pair');
});

test('rapid repeated Back cannot grow history; a cross-document jump cannot be blocked', async (context) => {
  const { page, origin } = await openFixture(context);
  await page.goto(`${origin}/tests/storyWindows/?outside=1`);
  await page.goto(`${origin}/tests/storyWindows/?reader=1`);
  await page.getByTestId('open-a').click();
  await page.evaluate(() => window.windowFixture.open('locked', false));
  const length = await page.evaluate(() => history.length);
  await page.evaluate(() => {
    history.back();
    history.back();
  });
  await settle(page);
  if (new URL(page.url()).search === '?reader=1') {
    const position = await page.evaluate(() => history.state?.activeBookWindows?.position);
    assert.ok(position === 'base' || position === 'guard');
    assert.equal((await active(page)).contentId, 'locked');
    context.diagnostic(`Immediate repeated Back ended on ${position}; Chromium can cancel compensating Forward.`);
    await page.evaluate(() => window.windowFixture.open('recovered'));
    await page.getByRole('dialog', { name: 'Окно recovered', exact: true }).waitFor();
    await waitPosition(page, 'guard');
    assert.equal((await active(page)).contentId, 'recovered', 'cancelled compensation does not freeze UI commands');
    await travel(page, -1);
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    assert.equal(await active(page), null, 'stale compensation cannot swallow the next window Back');
  } else {
    assert.equal(new URL(page.url()).search, '?outside=1');
    context.diagnostic('Immediate repeated Back left the reader document.');
  }
  assert.equal(await page.evaluate(() => history.length), length);
  await page.goto(`${origin}/tests/storyWindows/?outside=2`);
  await page.goto(`${origin}/tests/storyWindows/?reader=2`);
  await page.getByTestId('open-a').click();
  await page.evaluate(() => window.windowFixture.open('locked', false));
  const outsideUrl = `${origin}/tests/storyWindows/?outside=2`;
  // Native go(-2) models selecting an earlier document in the browser history menu.
  await page.evaluate(() => history.go(-2));
  await page.waitForURL(outsideUrl);
  await page.getByTestId('open-a').waitFor();
  assert.equal(await active(page), null, 'fresh document does not inherit the locked window');
});

test('a host listener opening a successor before the adapter receives popstate cannot close it', async (context) => {
  const { page } = await openFixture(context);
  await page.addInitScript(() => {
    addEventListener('popstate', () => {
      if (window.replaceOnPop) {
        window.replaceOnPop = false;
        window.windowFixture.open('host-successor');
      }
    });
  });
  await page.reload();
  await page.getByTestId('open-a').click();
  await page.evaluate(() => {
    window.replaceOnPop = true;
  });
  await travel(page, -1);
  await page.getByRole('dialog', { name: 'Окно host-successor', exact: true }).waitFor();
  await settle(page);
  assert.equal((await active(page)).contentId, 'host-successor');
  await waitPosition(page, 'guard');
  await travel(page, -1);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
});

test('closing or replacing during locked Back compensation does not resurrect the previous window', async (context) => {
  const { page } = await openFixture(context);
  const id = await page.evaluate(() => window.windowFixture.open('locked', false));
  await page.getByRole('dialog').waitFor();
  await page.evaluate((id) => {
    addEventListener('popstate', () => window.windowFixture.forceClose(id), { once: true });
    history.back();
  }, id);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await waitPosition(page, 'base');
  await settle(page);
  assert.equal(await page.evaluate(() => window.popCount), 3, 'Back, compensation, then consume the closed guard');
  assert.equal(await active(page), null);
  await page.evaluate(() => {
    window.windowFixture.open('locked-again', false);
    addEventListener('popstate', () => window.windowFixture.open('successor'), { once: true });
    history.back();
  });
  await page.getByRole('dialog', { name: 'Окно successor', exact: true }).waitFor();
  await waitPosition(page, 'guard');
  await settle(page);
  assert.equal((await active(page)).contentId, 'successor');
});
