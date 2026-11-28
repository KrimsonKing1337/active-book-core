import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openBrowserFixture } from '../browserFixture.js';

const fixturePage = async (context) => {
  const { origin, browser } = await openBrowserFixture(context);
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

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

const getPlayingVoice = (audio) => audio.evaluate(async (instance) => {
  const { readVoices } = await import('/tests/audioLifecycle/fadeFixture.js');

  return readVoices(instance).find((voice) => voice.playing)?.id;
});

const enableAudio = async (page) => {
  await page.getByRole('button', { name: 'Разрешить звук' }).click();
  await page.getByTestId('audio-permission').filter({ hasText: 'Звук разрешён' }).waitFor();
};

const selectEffect = (page, id) => page.getByRole('combobox', { name: 'Эффект' }).selectOption(id);

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

  await scene(page, '5. Вышка').click();
  assert.equal(await current.getAttribute('data-playback'), 'outside');
  assert(await page.getByRole('button', { name: 'Запустить' }).isDisabled());
  await scene(page, '4. Фарватер').click();
  await playing(current).waitFor();
  assert.equal(await current.getAttribute('data-instance'), first);

  await page.getByRole('button', { name: 'Остановить' }).click();
  await scene(page, '5. Вышка').click();
  await scene(page, '4. Фарватер').click();
  await ready(current).waitFor();
  assert.equal(await current.getAttribute('data-instance'), first);
  assert.equal(await current.getAttribute('data-position'), '0');

  await page.getByRole('button', { name: 'Запустить' }).click();
  await playing(current).waitFor();
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await scene(page, '5. Вышка').click();
  await scene(page, '4. Фарватер').click();
  await ready(current).waitFor();
  assert.equal(await current.getAttribute('data-instance'), first);
  assert(Number(await current.getAttribute('data-position')) > 0);
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

  await scene(page, '6. Машинный зал').click();
  await playing(row(page, 'relay-6')).waitFor();
  await echo.locator('xpath=self::*[@data-instance]').waitFor();
  assert.notEqual(await echo.getAttribute('data-instance'), firstEcho);
  const relay6 = await getAudio(page, 'relay-6');
  await page.getByRole('slider', { name: 'Громкость SFX' }).press('Home');
  assert.equal(await relay5.evaluate((audio) => audio.howlInst.volume()), 0);

  await scene(page, '7. Ворота').click();
  await playing(row(page, 'relay-7')).waitFor();
  const relay7 = await getAudio(page, 'relay-7');
  await scene(page, '8. Берег').click();
  await waitForDisposal(page, relay5);
  await waitForDisposal(page, relay6);
  assert(await relay7.evaluate((audio) => audio.isFading));

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
  const voice = await getPlayingVoice(engine);
  assert.equal(typeof voice, 'number');

  await scene(page, '7. Ворота').click();
  assert.equal(await engine.evaluate((audio, id) => audio.howlInst.loop(id), voice), false);
  assert(await engine.evaluate((audio, id) => audio.howlInst.playing(id), voice));
  await waitForDisposal(page, engine);

  await playing(row(page, 'relay-7')).waitFor();
  const relay7 = await getAudio(page, 'relay-7');
  await page.getByRole('button', { name: 'Закрыть книгу' }).click();
  await waitForDisposal(page, relay7);
  assert.equal(await page.getByTestId('audio-visit').innerText(), 'Книга закрыта');
});
