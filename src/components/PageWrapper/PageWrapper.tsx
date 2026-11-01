import { type HTMLAttributes, type PropsWithChildren, useEffect } from 'react';

import classNames from 'classnames';

import { useDispatch, useSelector } from '@store';

import { mainSelectors } from '@store/main';
import { segmentsActions } from '@store/segments';
import { backgroundEffectsActions } from '@store/effects/background';
import { frameEffectsActions } from '@store/effects/frame';

import { Toolbar } from '@components/Toolbar';
import { Menu } from '@components/Menu';
import { TableOfContents } from '@components/TableOfContents';
import { Bookmarks } from '@components/Bookmarks';
import { FrameEffects } from '@components/FrameEffects';
import { BackgroundEffects } from '@components/BackgroundEffects';

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
      dispatch(backgroundEffectsActions.setEffects({}));
      dispatch(frameEffectsActions.setEffects({}));
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
      <div id="main-content-wrapper" className={mainContendClassNames}>
        <div className={styles.NarrativeFrame} data-book-region="page frame">
          <Narrative>
            {children}
          </Narrative>

          <FrameEffects />
        </div>

        <BackgroundEffects />

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
