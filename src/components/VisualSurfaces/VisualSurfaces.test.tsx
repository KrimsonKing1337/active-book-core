import { render } from '@testing-library/react';

import { BookApplicationContext } from '@components/BookApplicationSurface/context';
import { StoryRegionsProvider } from '@components/StoryRegionsProvider';
import { VisualHost } from '@components/VisualHost';

import type { VisualSurfaceItem } from './@types';

import { VisualSurfaces } from './VisualSurfaces';

test.each([
  ['background', 'underStory'],
  ['aboveNarrative', 'aboveStory'],
  ['systemFeedback', 'feedback'],
] as const)('application %s surfaces use the %s host', (plane, host) => {
  const application = {
    element: document.createElement('div'),
    hosts: {
      underStory: document.createElement('div'),
      aboveStory: document.createElement('div'),
      feedback: document.createElement('div'),
      selection: null,
    },
    setInverseColors: jest.fn(),
  };
  const item: VisualSurfaceItem = {
    id: 'application-effect',
    placement: { region: 'application' },
    depth: { plane, order: 0 },
    content: 'effect content',
  };

  render(
    <StoryRegionsProvider>
      <BookApplicationContext value={application}>
        <VisualSurfaces items={[item]} stride={2} />
      </BookApplicationContext>
    </StoryRegionsProvider>,
  );

  expect(application.hosts[host]).toHaveTextContent('effect content');
  expect(application.element).toBeEmptyDOMElement();
});

test.each(['background', 'systemFeedback'] as const)(
  'without an application host, only system feedback falls back to the story (%s)',
  (plane) => {
    const item: VisualSurfaceItem = {
      id: 'external-effect',
      placement: { region: 'application' },
      depth: { plane, order: 0 },
      content: 'external content',
    };
    const view = render(
      <StoryRegionsProvider>
        <VisualHost region="story" />
        <VisualSurfaces items={[item]} stride={2} />
      </StoryRegionsProvider>,
    );

    expect(view.queryByText('external content') !== null).toBe(plane === 'systemFeedback');
  },
);

test('local feedback uses its own region host', () => {
  const item: VisualSurfaceItem = {
    id: 'local-feedback',
    placement: { region: 'storyViewport' },
    depth: { plane: 'systemFeedback', order: 0 },
    content: 'local feedback',
  };
  const view = render(
    <StoryRegionsProvider>
      <VisualHost region="storyViewport" />
      <VisualSurfaces items={[item]} stride={2} />
    </StoryRegionsProvider>,
  );

  expect(view.container.querySelector('[data-visual-host="storyViewport"]')).toHaveTextContent('local feedback');
});
