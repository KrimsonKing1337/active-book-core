import { createVisualControllers } from '../controllers';

const makePlayback = () => ({
  play: jest.fn(), pause: jest.fn(), stop: jest.fn(),
});

test('static renderers have a controller but no fabricated playback methods', () => {
  const remove = jest.fn();
  const controllers = createVisualControllers({ remove });
  const detach = controllers.attach({ id: 'static', readPlayback: () => null });
  const controller = controllers.get('static');

  expect(controller?.playback).toBeUndefined();
  controller?.destroy();
  controller?.destroy();
  expect(remove).toHaveBeenCalledWith('static');
  detach();
  controller?.destroy();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('stale controllers, playback references and cleanups cannot affect a new activation', () => {
  const remove = jest.fn();
  const controllers = createVisualControllers({ remove });
  const playback = makePlayback();
  const detach = controllers.attach({ id: 'test', readPlayback: () => playback });
  const oldController = controllers.get('test');
  const oldPlayback = oldController?.playback;
  oldPlayback?.play();
  expect(playback.play).toHaveBeenCalledTimes(1);
  controllers.invalidate('test');
  const replacement = makePlayback();
  controllers.attach({ id: 'test', readPlayback: () => replacement });
  oldPlayback?.play();
  oldPlayback?.pause();
  oldPlayback?.stop();
  oldController?.destroy();
  detach();
  expect(remove).not.toHaveBeenCalled();
  expect(replacement.play).not.toHaveBeenCalled();
  expect(playback.play).toHaveBeenCalledTimes(1);
  expect(controllers.get('test')?.playback).toBeDefined();
  controllers.clear();
  expect(controllers.get('test')).toBeUndefined();
});
