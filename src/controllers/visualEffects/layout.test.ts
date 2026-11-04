import { createViewportLayoutHost } from './layout';

test('exclusive leases restore current baseline, reject conflicts and ignore stale writes', () => {
  const invalidate = jest.fn();
  const host = createViewportLayoutHost(invalidate);
  const first = document.createElement('div');
  first.style.width = '80%';
  host.attach(first);
  const lease = host.acquire('scale');
  lease.update(0);
  expect(first.style.getPropertyValue('--visual-layout-factor')).toBe('0');
  expect(() => host.acquire('size')).toThrow('already controlled');
  expect(() => lease.update(Number.NaN)).toThrow('finite');
  first.style.width = '90%';
  const replacement = document.createElement('div');
  host.attach(replacement);
  expect(first.dataset.layoutMode).toBeUndefined();
  expect(replacement.dataset.layoutMode).toBe('scale');
  lease.release();
  lease.release();
  lease.update(0.3);
  expect(first.style.width).toBe('90%');
  expect(replacement.style.getPropertyValue('--visual-layout-factor')).toBe('');
  const next = host.acquire('size');
  host.reset();
  next.update(0);
  expect(host.hasLease()).toBe(false);
  expect(invalidate).toHaveBeenCalled();
});
