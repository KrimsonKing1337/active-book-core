import type { SideEffect } from '@hooks/effects/side/@types';

import { renderToStaticMarkup } from 'react-dom/server';

import { useSelector } from '@store';

import { SideEffects } from './SideEffects';

jest.mock('@store', () => ({
  useSelector: jest.fn(),
}));

test('renders effects in the correct frame layers', () => {
  const behindEffect: SideEffect = {
    id: 'behind',
    kind: 'component',
    layer: 'behind',
    Component: <span>BEHIND_EFFECT</span>,
  };
  const aboveEffect: SideEffect = {
    id: 'above',
    kind: 'component',
    layer: 'above',
    Component: <span>ABOVE_EFFECT</span>,
  };

  jest.mocked(useSelector).mockReturnValue({
    behind: behindEffect,
    above: aboveEffect,
  });

  const markup = renderToStaticMarkup(<SideEffects />);

  expect(markup).toContain('id="side-effects"');
  expect(markup.indexOf('BEHIND_EFFECT')).toBeLessThan(markup.indexOf('ABOVE_EFFECT'));
});

test('places a programmatic effect behind the narrative by default', () => {
  const effect: SideEffect = {
    id: 'default',
    kind: 'component',
    Component: <span>DEFAULT_EFFECT</span>,
  };

  jest.mocked(useSelector).mockReturnValue({ default: effect });

  const markup = renderToStaticMarkup(<SideEffects />);

  expect(markup).toContain('DEFAULT_EFFECT');
});
