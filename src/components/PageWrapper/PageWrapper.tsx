import { type HTMLAttributes, type PropsWithChildren, useContext } from 'react';

import classNames from 'classnames';

import { useSelector } from '@store';

import { mainSelectors } from '@store/main';

import { Toolbar } from '@components/Toolbar';
import { Menu } from '@components/Menu';
import { TableOfContents } from '@components/TableOfContents';
import { Bookmarks } from '@components/Bookmarks';
import { useBookApplicationSurface } from '@components/BookApplicationSurface/context';

import { Narrative } from './components/Narrative';
import { NarrativeFrameContext } from './NarrativeFrameContext';
import { useBookWindows } from './useBookWindows';

import * as styles from './PageWrapper.module.scss';

export type PageWrapperProps = HTMLAttributes<HTMLDivElement> & {
  withoutToolbar?: boolean;
  windowHistoryScope?: string;
  sbMode?: boolean;
};

export const PageWrapper = ({
  children,
  withoutToolbar,
  windowHistoryScope = 'book-windows',
  sbMode,
  ...etc
}: PropsWithChildren<PageWrapperProps>) => {
  const frame = useContext(NarrativeFrameContext);

  useBookWindows(windowHistoryScope);
  const application = useBookApplicationSurface();

  const showLoader = useSelector(mainSelectors.showLoader);


  const pageWrapperClassNames = classNames({
    [styles.PageWrapper]: true,
  });

  const mainContendClassNames = classNames({
    [styles.MainContent]: true,
    [styles.isLoading]: showLoader,
  });

  return (
    <div id="page-wrapper" className={pageWrapperClassNames} {...etc}>
      <div
        ref={application?.layout.attach}
        id="main-content-wrapper"
        className={mainContendClassNames}
        data-story-region="storyViewport"
      >
        <div ref={frame?.attach} className={styles.NarrativeFrame} data-story-region="narrativeFrame">
          <Narrative>
            {children}
          </Narrative>

        </div>


        {!withoutToolbar && (
          <Toolbar sbMode={sbMode} />
        )}

        <Menu />
        <TableOfContents />
        <Bookmarks />
      </div>
    </div>
  );
};
