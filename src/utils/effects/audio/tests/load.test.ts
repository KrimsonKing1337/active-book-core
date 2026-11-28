import { Howl } from 'howler';

import { emit, installHowlerFixture } from './howlerFixture';

let fixture: ReturnType<typeof installHowlerFixture>;

beforeEach(() => {
  fixture = installHowlerFixture();
});

afterEach(() => fixture.restore());

test('reports a synchronous rejection to an observer added after construction', () => {
  jest.spyOn(Howl.prototype, 'state').mockReturnValue('unloaded');
  const audio = fixture.create();
  const listener = jest.fn();
  audio.observeLoad(listener);
  expect(listener).toHaveBeenCalledWith('failed');
});

test('catches a loaderror emitted by the constructor and retains it for late observers', async () => {
  jest.spyOn(Howl.prototype, 'state').mockReturnValue('loading');
  jest.spyOn(Howl.prototype, 'load').mockImplementation(function (this: Howl) {
    emit(this, 'loaderror');

    return this;
  });
  const audio = fixture.create();
  await jest.advanceTimersByTimeAsync(0);
  const listener = jest.fn();
  audio.observeLoad(listener);
  expect(listener).toHaveBeenCalledWith('failed');
});

test('delivers the cached load result and ignores queued events for a removed listener', async () => {
  jest.spyOn(Howl.prototype, 'state').mockReturnValue('loading');
  const audio = fixture.create();
  const retired = jest.fn();
  const unsubscribe = audio.observeLoad(retired);
  emit(audio.howlInst, 'load');
  unsubscribe?.();
  await jest.advanceTimersByTimeAsync(0);
  expect(retired).not.toHaveBeenCalled();
  const current = jest.fn();
  audio.observeLoad(current);
  expect(current).toHaveBeenCalledTimes(1);
  expect(current).toHaveBeenCalledWith('ready');
});

test('settles outstanding observers on unload and ignores later results', async () => {
  jest.spyOn(Howl.prototype, 'state').mockReturnValue('loading');
  const audio = fixture.create();
  const listener = jest.fn();
  audio.observeLoad(listener);
  emit(audio.howlInst, 'loaderror');
  await audio.unload({ immediate: true });
  await jest.advanceTimersByTimeAsync(0);
  expect(listener.mock.calls).toEqual([['cancelled']]);
});
