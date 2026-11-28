import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chromium, webkit } from 'playwright';

import { openBrowserFixture } from '../browserFixture.js';

const useHtml5 = process.env.PLAYWRIGHT_AUDIO_TRANSPORT === 'html5';
let browserType = chromium;

if (process.env.PLAYWRIGHT_AUDIO_BROWSER === 'webkit') {
  browserType = webkit;
}

const fixturePage = async (context) => {
  const { origin, browser } = await openBrowserFixture(context, browserType);
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  if (useHtml5) {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'AudioContext', { value: undefined });
      Object.defineProperty(window, 'webkitAudioContext', { value: undefined });
    });
  }

  return { page, url: `${origin}/tests/audioPlayground/` };
};

const row = (page, id) => page.locator(`[data-effect="${id}"]`);
const playing = (effect) => effect.locator('xpath=self::*[@data-playback="playing"]');
const ready = (effect) => effect.locator('xpath=self::*[@data-playback="ready"]');
const scene = (page, title) => page.getByRole('navigation', { name: 'Страницы истории' })
  .getByRole('button', { name: title });
const waitForReveal = (page, name) => page.getByTestId('audio-visit')
  .filter({ hasText: `${name} · раскрыта` }).waitFor();

const getAudio = (page, id) => page.evaluateHandle(async (effectId) => {
  const { store } = await import('/src/store/index.ts');

  return store.getState().audioEffects.audioInstances[effectId];
}, id);

const waitForDisposal = (page, audio) => page.waitForFunction((instance) => {
  return instance.isUnloading && !instance.playing() && instance.state() === 'unloaded';
}, audio);

const enableAudio = async (page) => {
  await page.getByRole('button', { name: 'Разрешить звук' }).click();
  await page.getByTestId('audio-permission').filter({ hasText: 'Звук разрешён' }).waitFor();
};

const selectEffect = (page, id) => page.getByRole('combobox', { name: 'Эффект' }).selectOption(id);

const returnFromTower = (trigger, options) => trigger.evaluate(async (button, { audio, startsCommand }) => {
  const { store } = await import('/src/store/index.ts');
  const { mainActions } = await import('/src/store/main/index.ts');
  const getCurrent = () => store.getState().audioEffects.audioInstances.current;

  // Leave and return in one browser turn, independently of browser-driver latency.
  button.click();

  if (startsCommand) {
    store.dispatch(mainActions.setPage(5));
  }

  const isUnavailable = getCurrent() === undefined;
  store.dispatch(mainActions.setPage(4));

  return { isUnavailable, isRestored: getCurrent() === audio };
}, options);

const pauseFor = (page, milliseconds) => page.evaluate((duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
}, milliseconds);

test('direct range entry waits for a gesture and a broken destination still reveals', async (context) => {
  const { page, url } = await fixturePage(context);
  const release = Promise.withResolvers();
  context.after(release.resolve);
  await page.route('**/tone.wav?arrival', async (route) => {
    await release.promise;
    await route.continue();
  });

  await page.goto(`${url}?page=wharf`);
  await waitForReveal(page, 'Причал');
  const current = row(page, 'current');
  const clock = row(page, 'clock');
  await ready(current).waitFor();
  const currentNumber = await current.getAttribute('data-instance');
  assert(currentNumber);
  assert.equal(await page.getByTestId('audio-permission').innerText(), 'Звук ждёт жеста');
  await enableAudio(page);
  await playing(current).waitFor();
  const currentAudio = await getAudio(page, 'current');
  const isUsingHtml5 = await currentAudio.evaluate((audio) => {
    return audio.howlInst._sounds.some(({ _node }) => _node instanceof HTMLAudioElement);
  });
  assert.equal(isUsingHtml5, useHtml5);

  await Promise.all([
    page.waitForRequest('**/tone.wav?arrival'),
    scene(page, '3. Буйки').click(),
  ]);
  await page.getByTestId('audio-visit').filter({ hasText: 'Страница 3 · подготовка' }).waitFor();
  assert.equal(await current.getAttribute('data-playback'), 'playing');
  assert.equal(await current.getAttribute('data-instance'), currentNumber);
  release.resolve();

  await waitForReveal(page, 'Буйки');
  await row(page, 'broken').filter({ hasText: 'Ошибка загрузки' }).waitFor();
  await playing(row(page, 'depth')).waitFor();
  await playing(clock).waitFor();
  assert.equal(await current.getAttribute('data-playback'), 'playing');
  assert.notEqual(await clock.getAttribute('data-instance'), currentNumber);
  await scene(page, '4. Фарватер').click();
  await waitForReveal(page, 'Фарватер');
  await ready(clock).waitFor({ timeout: 8000 });
  assert.equal(await row(page, 'missed').getAttribute('data-playback'), 'ready');
  await page.getByRole('button', { name: 'Запустить' }).click();
  await playing(clock).waitFor();
});

test('a late gesture preserves the timer and pause cancels the pending autoplay', async (context) => {
  const { page, url } = await fixturePage(context);
  await page.goto(`${url}?page=wharf`);
  await waitForReveal(page, 'Причал');
  const clock = row(page, 'clock');
  await ready(clock).waitFor();
  await pauseFor(page, 2200);
  assert.equal(await clock.getAttribute('data-playback'), 'ready');
  await enableAudio(page);
  await playing(clock).waitFor({ timeout: 1500 });

  await page.reload();
  await waitForReveal(page, 'Причал');
  await ready(clock).waitFor();
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await page.getByTestId('audio-permission').filter({ hasText: 'Звук разрешён' }).waitFor();
  await pauseFor(page, 2200);
  assert.equal(await clock.getAttribute('data-playback'), 'ready');
  await page.getByRole('button', { name: 'Запустить' }).click();
  await playing(clock).waitFor();
});

test('manual volume and halt controls preserve the current on fast reentry', async (context) => {
  const { page, url } = await fixturePage(context);
  await page.goto(`${url}?page=channel`);
  await waitForReveal(page, 'Фарватер');
  await enableAudio(page);
  const current = row(page, 'current');
  await playing(current).waitFor();
  const first = await current.getAttribute('data-instance');
  assert(first);
  await selectEffect(page, 'current');
  const currentAudio = await getAudio(page, 'current');
  const volume = await currentAudio.evaluate((audio) => audio.howlInst.volume());
  assert(volume > 0);
  await page.getByRole('button', { name: 'Вдвое тише' }).click();
  assert.equal(await currentAudio.evaluate((audio) => audio.howlInst.volume()), volume / 2);
  await page.getByRole('button', { name: 'Уровень микшера' }).click();
  assert.equal(await currentAudio.evaluate((audio) => audio.howlInst.volume()), volume);

  assert.deepEqual(await returnFromTower(scene(page, '5. Вышка'), { audio: currentAudio }), {
    isUnavailable: true,
    isRestored: true,
  });
  await playing(current).waitFor();
  assert.equal(await current.getAttribute('data-instance'), first);

  const stop = page.getByRole('button', { name: 'Остановить' });
  assert.deepEqual(await returnFromTower(stop, { audio: currentAudio, startsCommand: true }), {
    isUnavailable: true,
    isRestored: true,
  });
  await ready(current).waitFor();
  assert.equal(await current.getAttribute('data-instance'), first);
  assert.equal(await current.getAttribute('data-position'), '0');
  assert.equal(await page.locator('[data-audio-event="onStop"][data-audio-effect="current"]').count(), 1);

  await page.getByRole('button', { name: 'Запустить' }).click();
  await playing(current).waitFor();
  const pause = page.getByRole('button', { name: 'Пауза', exact: true });
  assert.deepEqual(await returnFromTower(pause, { audio: currentAudio, startsCommand: true }), {
    isUnavailable: true,
    isRestored: true,
  });
  await ready(current).waitFor();
  assert.equal(await current.getAttribute('data-instance'), first);
  assert(Number(await current.getAttribute('data-position')) > 0);
  assert.equal(await page.locator('[data-audio-event="onPause"][data-audio-effect="current"]').count(), 1);

  await scene(page, '5. Вышка').click();
  await current.locator('xpath=self::*[@data-playback="outside"]').waitFor();
  assert(await page.getByRole('button', { name: 'Запустить' }).isDisabled());
});

test('disjoint intervals and rapid exits preserve mixer control and release sounds on book swap', async (context) => {
  const { page, url } = await fixturePage(context);
  await page.goto(`${url}?page=buoys`);
  await waitForReveal(page, 'Буйки');
  const echo = row(page, 'echo');
  await ready(echo).waitFor();
  const firstEcho = await echo.getAttribute('data-instance');
  assert(firstEcho);
  await enableAudio(page);

  await scene(page, '5. Вышка').click();
  await playing(row(page, 'relay-5')).waitFor();
  assert.equal(await echo.getAttribute('data-playback'), 'outside');
  const relay5 = await getAudio(page, 'relay-5');
  await selectEffect(page, 'relay-5');
  await page.getByRole('button', { name: 'Остановить' }).click();

  await scene(page, '6. Машинный зал').click();
  await page.getByRole('slider', { name: 'Громкость SFX' }).press('Home');
  await page.waitForFunction((audio) => audio.isFading && audio.howlInst.volume() === 0, relay5, { timeout: 1000 });
  await playing(row(page, 'relay-6')).waitFor();
  await echo.locator('xpath=self::*[@data-instance]').waitFor();
  assert.notEqual(await echo.getAttribute('data-instance'), firstEcho);
  const relay6 = await getAudio(page, 'relay-6');

  await scene(page, '7. Ворота').click();
  await playing(row(page, 'relay-7')).waitFor();
  const relay7 = await getAudio(page, 'relay-7');
  await scene(page, '8. Берег').click();
  await waitForDisposal(page, relay5);
  await waitForDisposal(page, relay6);
  assert(await relay7.evaluate((audio) => audio.isFading));
  const relayEvents = await page.locator('[data-audio-effect="relay-5"]').allTextContents();
  assert.deepEqual(relayEvents, ['onUnload · relay-5', 'onStop · relay-5']);

  await page.getByRole('button', { name: 'Открыть тихую книгу' }).click();
  await waitForReveal(page, 'Тихий берег');
  await waitForDisposal(page, relay7);
  assert.equal(await page.locator('[data-effect]:not([data-playback="outside"])').count(), 0);
});

test('the engine finishes its current loop and closing the book releases the active relay', async (context) => {
  const { page, url } = await fixturePage(context);
  await page.goto(`${url}?page=engine`);
  await waitForReveal(page, 'Машинный зал');
  await enableAudio(page);
  await playing(row(page, 'engine')).waitFor();
  const engine = await getAudio(page, 'engine');
  const transition = await scene(page, '7. Ворота').evaluate(async (button, audio) => {
    const { readVoices } = await import('/tests/audioLifecycle/fadeFixture.js');
    const voice = readVoices(audio).find((entry) => entry.playing)?.id;

    if (voice === undefined) {
      throw new Error('The engine has no playing voice');
    }

    const wasLooping = audio.howlInst.loop(voice);
    // Sample in the navigation turn, before the current iteration can end.
    button.click();

    return {
      wasLooping,
      isLooping: audio.howlInst.loop(voice),
      isPlaying: audio.howlInst.playing(voice),
    };
  }, engine);
  assert.deepEqual(transition, {
    wasLooping: true,
    isLooping: false,
    isPlaying: true,
  });
  await waitForDisposal(page, engine);

  await playing(row(page, 'relay-7')).waitFor();
  const relay7 = await getAudio(page, 'relay-7');
  await page.getByRole('button', { name: 'Закрыть книгу' }).click();
  await waitForDisposal(page, relay7);
  assert.equal(await page.getByTestId('audio-visit').innerText(), 'Книга закрыта');
  assert.deepEqual(await page.locator('[data-audio-effect="relay-7"]').allTextContents(), ['onUnload · relay-7']);
});
