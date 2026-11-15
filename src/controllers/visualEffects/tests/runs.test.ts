import { createEffectRuns } from '../runs';

test('late milestones, duplicate reports, restart and stale callbacks are deterministic', async () => {
  const runs = createEffectRuns();
  const notified = jest.fn();
  runs.subscribe(notified);
  const first = runs.start('dark');
  first.milestone('edge');
  first.milestone('edge');
  expect(notified).toHaveBeenCalledTimes(2);
  await runs.wait(first.key, { milestone: 'edge', signal: new AbortController().signal });
  expect(runs.listenerCount()).toBe(1);
  const second = runs.start('dark');
  second.pause();
  expect(runs.read('dark')?.status).toBe('paused');
  second.resume();
  expect(runs.read('dark')?.number).toBe(second.key.number);
  first.complete();
  expect(runs.read('dark')?.status).toBe('running');
  const waiting = runs.wait(second.key, { signal: new AbortController().signal });
  second.complete();
  await waiting;
  expect(runs.read('dark')?.milestones).toEqual([]);
  runs.destroy();
  expect(runs.listenerCount()).toBe(0);
});

test('scope exit and abort release wait subscriptions; destruction invalidates reporters', async () => {
  const runs = createEffectRuns();
  const first = runs.start('dark');
  const cancelled = runs.wait(first.key, { signal: new AbortController().signal });
  runs.retainActive(new Set());
  await expect(cancelled).rejects.toMatchObject({ name: 'AbortError' });
  const second = runs.start('dark');
  const controller = new AbortController();
  const aborted = runs.wait(second.key, { signal: controller.signal });
  controller.abort();
  await expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
  expect(runs.listenerCount()).toBe(0);
  const pending = runs.wait(second.key, { signal: new AbortController().signal });
  runs.destroy();
  await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  second.complete();
  expect(runs.read('dark')).toBeUndefined();
  expect(() => runs.start('dark')).toThrow('destroyed');
});
