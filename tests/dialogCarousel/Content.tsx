import { useState } from 'react';

import type { StoryWindowContent } from '../../src/components/StoryWindowHost';

import { Carousel } from '../../src/components/Carousel';
import { WithModal } from '../../src/components/ColoredTextTrigger/WithModal';
import { StoryWindowHost, useStoryWindowActions } from '../../src/components/StoryWindowHost';

import {
  galleryNodes,
  Portrait,
  renderGallery,
} from './gallery';

const pageSlides = ['Page one', 'Page two'].map((text) => (
  <p key={text}>
    {text}
  </p>
));

export const Content = () => {
  const { open } = useStoryWindowActions();
  const [revision, setRevision] = useState(0);

  const resolveContent = (contentId: string): StoryWindowContent => {
    if (contentId === 'portrait') {
      return {
        title: 'Single portrait',
        nodes: [{ type: 'image' }],
        render: () => <Portrait />,
      };
    }

    return {
      title: 'Model gallery',
      width: 80,
      height: 80,
      nodes: [...galleryNodes],
      render: renderGallery,
    };
  };

  return (
    <div data-testid="content" data-revision={revision}>
      <button type="button" onClick={() => open({ contentId: 'gallery' })}>
        Open gallery
      </button>

      <button type="button" onClick={() => open({ contentId: 'portrait' })}>
        Open portrait
      </button>

      <WithModal text="Explicit JSX" triggerType="action" mode="default">
        <Portrait />
      </WithModal>

      <Carousel slides={pageSlides} />

      <button type="button" onClick={() => setRevision((previous) => previous + 1)}>
        Rerender resolver
      </button>

      <StoryWindowHost resolveContent={resolveContent} />
    </div>
  );
};
