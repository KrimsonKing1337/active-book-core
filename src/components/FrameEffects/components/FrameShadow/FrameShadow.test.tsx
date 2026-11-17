import { renderToStaticMarkup } from 'react-dom/server';

import type { FrameSide } from '@hooks/effects/frame/@types';


import { FrameShadow } from './FrameShadow';

const renderShadow = (sides: FrameSide[]) => {
  return renderToStaticMarkup(
    <FrameShadow
      options={{
        id: 'shadow',
        sides,
        thickness: 20, 
      }}
    />,
  );
};

test('renders only the selected sides of a shadow', () => {
  const markup = renderShadow(['top', 'bottom']);

  expect(markup).toContain('inset 0 20px 20px -20px');
  expect(markup).toContain('inset 0 -20px 20px -20px');
  expect(markup).not.toContain('inset 20px 0 20px -20px');
  expect(markup).not.toContain('inset -20px 0 20px -20px');
});

test('renders all four sides when selected', () => {
  const markup = renderShadow([
    'top',
    'right',
    'bottom',
    'left',
  ]);

  expect(markup).toContain('inset 0 20px 20px -20px');
  expect(markup).toContain('inset -20px 0 20px -20px');
  expect(markup).toContain('inset 0 -20px 20px -20px');
  expect(markup).toContain('inset 20px 0 20px -20px');
});

test('renders no inset shadows when no sides are selected', () => {
  const markup = renderShadow([]);

  expect(markup).not.toContain('inset');
});
