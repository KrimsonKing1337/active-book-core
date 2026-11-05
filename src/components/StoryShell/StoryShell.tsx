import { type HTMLAttributes, type PropsWithChildren } from 'react';

import classNames from 'classnames';

import { useSelector } from '@store';

import { mainSelectors } from '@store/main';

import { Toolbar } from '@components/Toolbar';
import { Menu } from '@components/Menu';
import { TableOfContents } from '@components/TableOfContents';
import { Bookmarks } from '@components/Bookmarks';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { VisualHost } from '@components/VisualHost';

import { Narrative } from './components/Narrative';
import { useBookWindows } from './useBookWindows';

import * as styles from './StoryShell.module.scss';

export type StoryShellProps = HTMLAttributes<HTMLDivElement> & {
  withoutToolbar?: boolean;
  windowHistoryScope?: string;
  sbMode?: boolean;
};

export const StoryShell = ({
  children,
  withoutToolbar,
  windowHistoryScope = 'book-windows',
  sbMode,
  ...etc
}: PropsWithChildren<StoryShellProps>) => {

  useBookWindows(windowHistoryScope);
  const { refs } = useStoryRegions();

  const showLoader = useSelector(mainSelectors.showLoader);


  const storyShellClassNames = classNames({
    [styles.StoryShell]: true,
  });

  const storyViewportClassNames = classNames({
    [styles.StoryViewport]: true,
    [styles.isLoading]: showLoader,
  });

  return (
    <div id="story-shell" className={storyShellClassNames} {...etc}>
      <div
        ref={refs.storyViewport}
        id="story-viewport"
        className={storyViewportClassNames}
        data-story-region="storyViewport"
      >
        <div ref={refs.narrativeFrame} className={styles.NarrativeFrame} data-story-region="narrativeFrame">
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
