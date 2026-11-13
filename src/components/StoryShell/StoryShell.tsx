import type { HTMLAttributes, PropsWithChildren } from 'react';

import { Toolbar } from '@components/Toolbar';
import { Menu } from '@components/Menu';
import { TableOfContents } from '@components/TableOfContents';
import { Bookmarks } from '@components/Bookmarks';
import { VisualHost } from '@components/VisualHost';

import { useStoryRegions } from '@components/StoryRegionsProvider';

import { Narrative } from './components';

import * as styles from './StoryShell.module.scss';

export type StoryShellProps = HTMLAttributes<HTMLDivElement> & {
  withoutToolbar?: boolean;
  sbMode?: boolean;
};

export const StoryShell = ({
  children,
  withoutToolbar,
  sbMode,
  ...etc
}: PropsWithChildren<StoryShellProps>) => {

  const { refs } = useStoryRegions();

  return (
    <div id="story-shell" className={styles.StoryShell} {...etc}>
      <div
        ref={refs.storyViewport}
        id="story-viewport"
        className={styles.StoryViewport}
        data-story-region="storyViewport"
        tabIndex={-1}
      >
        <div
          ref={refs.storyViewportFrame}
          className={styles.StoryViewportFrame}
          data-story-region="storyViewportFrame"
        >
          <VisualHost region="storyViewportFrame" />
        </div>

        <div
          ref={refs.narrativeFrame}
          className={styles.NarrativeFrame}
          data-story-region="narrativeFrame"
        >
          <Narrative>
            {children}
          </Narrative>

          <VisualHost region="narrativeFrame" />
        </div>

        {!withoutToolbar && (
          <Toolbar sbMode={sbMode} />
        )}

        <VisualHost region="storyViewport" />
        <Menu />
        <TableOfContents />
        <Bookmarks />
      </div>
    </div>
  );
};
