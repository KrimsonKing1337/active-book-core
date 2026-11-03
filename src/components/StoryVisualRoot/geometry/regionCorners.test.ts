import { getRegionCorners } from './regionCorners';

const style = document.createElement('div').style;
style.borderTopLeftRadius = '10px';
style.borderTopRightRadius = '20px';
style.borderBottomRightRadius = '30px';
style.borderBottomLeftRadius = '40px';

const clip = {
  x: 100,
  y: 5,
  width: 500,
  height: 700,
};

test('the narrativeFrame keeps the player top corners without rounding the edge above its toolbar', () => {
  const region = {
    ...clip,
    height: 630,
  };
  expect(getRegionCorners({
    region,
    clip,
    style,
  })).toBe('10px 20px 0px 0px');
});

test('the complete viewport keeps every corner while an interior region has none', () => {
  expect(getRegionCorners({
    region: clip,
    clip,
    style,
  })).toBe('10px 20px 30px 40px');
  const interior = {
    x: 110,
    y: 15,
    width: 480,
    height: 680,
  };
  expect(getRegionCorners({
    region: interior,
    clip,
    style,
  })).toBe('0px 0px 0px 0px');
});
