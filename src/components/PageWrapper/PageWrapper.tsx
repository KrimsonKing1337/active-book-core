import { type HTMLAttributes, type PropsWithChildren, useEffect } from 'react';

import classNames from 'classnames';

import { useDispatch, useSelector } from '@store';

import { mainSelectors } from '@store/main';
import { segmentsActions } from '@store/segments';

import { Toolbar } from '@components/Toolbar';
import { Menu } from '@components/Menu';
import { TableOfContents } from '@components/TableOfContents';
import { Bookmarks } from '@components/Bookmarks';

import { Narrative } from './components/Narrative';

import * as styles from './PageWrapper.module.scss';

export type PageWrapperProps = HTMLAttributes<HTMLDivElement> & {
  withoutToolbar?: boolean;
  sbMode?: boolean;
};

export const PageWrapper = ({
  children,
  withoutToolbar,
  sbMode,
  ...etc
}: PropsWithChildren<PageWrapperProps>) => {
  const dispatch = useDispatch();

  const showLoader = useSelector(mainSelectors.showLoader);

  useEffect(() => {
    return () => {
      dispatch(segmentsActions.reset());
    };
  }, []);

  const pageWrapperClassNames = classNames({
    [styles.PageWrapper]: true,
  });

  const mainContendClassNames = classNames({
    [styles.MainContent]: true,
    [styles.isLoading]: showLoader,
  });

  return (
    <div id="page-wrapper" className={pageWrapperClassNames} {...etc}>
      <div id="main-content-wrapper" className={mainContendClassNames} data-story-region="storyViewport">
        <div className={styles.NarrativeFrame} data-story-region="narrativeFrame">
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
