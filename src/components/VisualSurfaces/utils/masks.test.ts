import { resolveShapeMask } from './masks';

const region = { x: 10, y: 20, width: 400, height: 200 };

const center = {
  x: { value: 25, unit: '%' as const },
  y: { value: 15, unit: 'px' as const },
};

test('circle percentages use the visibility rectangle and its smaller dimension', () => {
  expect(resolveShapeMask({
    type: 'circle',
    center,
    radius: { value: 10, unit: '%' },
  }, region)).toBe('circle(20px at 100px 15px)');
});

test('polygon vertices resolve independently, including coordinates outside the region', () => {
  expect(resolveShapeMask({
    type: 'polygon',
    points: [
      center,
      { x: { value: -1, unit: 'px' }, y: { value: 100, unit: '%' } },
      { x: { value: 100, unit: '%' }, y: { value: 50, unit: '%' } },
    ],
  }, region)).toBe('polygon(100px 15px, -1px 200px, 400px 100px)');
});

test('invalid masks hide rather than accidentally painting an unmasked surface', () => {
  expect(resolveShapeMask({ type: 'polygon', points: [center, center] }, region)).toBeNull();
  expect(resolveShapeMask({
    type: 'circle',
    center,
    radius: { value: -2, unit: 'px' },
  }, region)).toBeNull();
  expect(resolveShapeMask({
    type: 'polygon',
    points: [center, center, { x: { value: NaN, unit: 'px' }, y: { value: 0, unit: 'px' } }],
  }, region)).toBeNull();
});
