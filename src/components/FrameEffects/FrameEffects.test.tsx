import type { FrameEffect } from '@hooks/effects/frame/@types';

import { renderToStaticMarkup } from 'react-dom/server';

import { useSelector } from '@store';

import { FrameEffects } from './FrameEffects';

jest.mock('@store', () => ({
  useSelector: jest.fn(),
}));

test('renders effects in the correct frame layers', () => {
  const behindEffect: FrameEffect = {
    id: 'behind',
    kind: 'component',
    layer: 'behind',
    Component: <span>BEHIND_EFFECT</span>,
  };
  const aboveEffect: FrameEffect = {
    id: 'above',
    kind: 'component',
    layer: 'above',
    Component: <span>ABOVE_EFFECT</span>,
  };

  jest.mocked(useSelector).mockReturnValue({
    behind: behindEffect,
    above: aboveEffect,
  });

  const markup = renderToStaticMarkup(<FrameEffects />);

  const behindMarkup = markup.split('data-frame-layer="behind"')[1].split('data-frame-layer="above"')[0];
  const aboveMarkup = markup.split('data-frame-layer="above"')[1];

  expect(behindMarkup).toContain('BEHIND_EFFECT');
  expect(behindMarkup).not.toContain('ABOVE_EFFECT');
  expect(aboveMarkup).toContain('ABOVE_EFFECT');
  expect(aboveMarkup).not.toContain('BEHIND_EFFECT');
});

test('places a programmatic effect behind the narrative by default', () => {
  const effect: FrameEffect = {
    id: 'default',
    kind: 'component',
    Component: <span>DEFAULT_EFFECT</span>,
  };

  jest.mocked(useSelector).mockReturnValue({ default: effect });

  const markup = renderToStaticMarkup(<FrameEffects />);

  const behindMarkup = markup.split('data-frame-layer="behind"')[1].split('data-frame-layer="above"')[0];

  expect(behindMarkup).toContain('DEFAULT_EFFECT');
});
