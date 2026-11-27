import assert from 'node:assert/strict';
import { test } from 'node:test';

import { openBrowserFixture } from '../browserFixture.js';

const openBook = async (context, mode = '') => {
  const { browser, origin } = await openBrowserFixture(context);
  const page = await browser.newPage();
  context.after(() => page.close());
  await page.goto(`${origin}/tests/bookAudio/?mode=${mode}`);
  await page.waitForFunction(() => window.bookAudio?.visit()?.presentedAt != null);
  await page.getByRole('button', { name: 'Enable audio' }).click();

  return page;
};

test('range playback and position continue while the destination visit loads another sound', async (context) => {
  const page = await openBook(context);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  context.after(() => release());
  await page.route('**/tone.wav?preparing', async (route) => {
    await gate;
    await route.continue();
  });

  const duringPreparation = await page.evaluate(async () => {
    const { meter, readVoices, until, wait } = await import('/tests/audioLifecycle/fadeFixture.js');
    const book = window.bookAudio;
    await until(() => book.plays.includes('range'));
    const audio = book.get('range');
    const signal = meter();
    await until(() => signal.rms() > 0.001);
    const voiceId = readVoices(audio)[0].id;
    const initialPosition = audio.howlInst.seek(voiceId);
    book.navigate(2);
    await until(() => Object.keys(book.visit().pendingResources).length === 1);
    await wait(80);
    const currentPosition = audio.howlInst.seek(voiceId);
    const result = {
      sameAudio: audio === book.get('range'),
      sameVoice: voiceId === readVoices(audio)[0].id,
      positionAdvance: currentPosition - initialPosition,
      pendingPresentation: book.visit().presentedAt === null,
      rms: signal.rms(),
    };
    signal.close();

    return result;
  });
  assert.equal(duringPreparation.sameAudio, true);
  assert.equal(duringPreparation.sameVoice, true);
  assert(duringPreparation.positionAdvance > 0.05);
  assert.equal(duringPreparation.pendingPresentation, true);
  assert(duringPreparation.rms > 0.001);

  release();
  await page.waitForFunction(() => window.bookAudio.visit().presentedAt !== null);
  const afterClose = await page.evaluate(async () => {
    const { meter, until } = await import('/tests/audioLifecycle/fadeFixture.js');
    const book = window.bookAudio;
    const audio = book.get('range');
    const signal = meter();
    await until(() => signal.rms() > 0.01);
    book.close();
    await until(() => signal.rms() < 0.00001);
    signal.close();

    return { plays: book.plays, disposed: audio.isUnloading, playing: audio.playing() };
  });
  assert.deepEqual(afterClose.plays, ['range']);
  assert.equal(afterClose.disposed, true);
  assert.equal(afterClose.playing, false);
});

test('retiring audio restores the same voice and shortens a fade from its current output', async (context) => {
  const page = await openBook(context, 'generations');
  const result = await page.evaluate(async () => {
    const { meter, readVoices, until, wait } = await import('/tests/audioLifecycle/fadeFixture.js');
    const book = window.bookAudio;
    const signal = meter();
    await until(() => book.plays.includes('sound-1'));
    const first = book.get('sound-1');
    const voiceId = readVoices(first)[0].id;
    await until(() => signal.rms() > 0.01);
    const clock = window.audioLifecycle.howler.ctx;
    const fullWindowAt = clock.currentTime + signal.windowDuration;
    await until(() => clock.currentTime >= fullWindowAt);
    const baseline = signal.rms();

    book.navigate(4);
    await wait(250);
    const beforeRestore = signal.rms();
    const position = first.howlInst.seek(voiceId);
    book.navigate(1);
    await wait(45);
    const afterRestore = signal.rms();
    const restored = {
      sameAudio: book.get('sound-1') === first,
      sameVoice: readVoices(first)[0].id === voiceId,
      advanced: first.howlInst.seek(voiceId) > position,
    };

    book.navigate(2);
    await until(() => book.plays.includes('sound-2'));
    const second = book.get('sound-2');
    await wait(120);
    const beforeShorten = signal.rms();
    book.navigate(3);
    const start = performance.now();
    await wait(35);
    const afterShorten = signal.rms();
    await until(() => first.isUnloading);
    const shortenMs = performance.now() - start;
    await until(() => book.plays.includes('sound-3'));
    const third = book.get('sound-3');
    book.close();
    await until(() => signal.rms() < 0.00001);
    signal.close();

    return {
      restored,
      beforeRestore: beforeRestore / baseline,
      afterRestore: afterRestore / baseline,
      afterShorten: afterShorten / beforeShorten,
      shortenMs,
      firstPlayCount: book.plays.filter((id) => id === 'sound-1').length,
      disposed: [first, second, third].every((audio) => audio.isUnloading && !audio.playing()),
    };
  });

  context.diagnostic(JSON.stringify(result));
  assert.deepEqual(result.restored, { sameAudio: true, sameVoice: true, advanced: true });
  assert.equal(result.firstPlayCount, 1);
  assert(result.beforeRestore > 0.4 && result.beforeRestore < 0.95);
  assert(Math.abs(result.afterRestore - result.beforeRestore) < 0.18);
  assert(result.afterShorten > 0.2 && result.afterShorten < 0.9);
  assert(result.shortenMs >= 80 && result.shortenMs < 180);
  assert.equal(result.disposed, true);
});

test('waitTillTheEnd restores the loop on re-entry and finishes the current iteration on exit', async (context) => {
  const page = await openBook(context, 'wait');
  const result = await page.evaluate(async () => {
    const { readVoices, until } = await import('/tests/audioLifecycle/fadeFixture.js');
    const book = window.bookAudio;
    await until(() => book.plays.includes('sound-1'));
    const audio = book.get('sound-1');
    const id = readVoices(audio)[0].id;
    book.navigate(2);
    const isLoopDisabled = !audio.howlInst.loop(id);
    const continuedUntilEnd = audio.playing();
    book.navigate(1);
    const isLoopRestored = audio.howlInst.loop(id);
    const isSameAudio = book.get('sound-1') === audio;
    book.navigate(2);
    await until(() => audio.isUnloading);

    return { isLoopDisabled, continuedUntilEnd, isLoopRestored, isSameAudio, playing: audio.playing() };
  });

  assert.deepEqual(result, {
    isLoopDisabled: true,
    continuedUntilEnd: true,
    isLoopRestored: true,
    isSameAudio: true,
    playing: false,
  });
});
