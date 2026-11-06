import BookmarkIcon from '@assets/img/toolbar/i-bookmark.svg';
import FontSmallIcon from '@assets/img/toolbar/i-font-small.svg';
import FontBigIcon from '@assets/img/toolbar/i-font-big.svg';
import EtcIcon from '@assets/img/toolbar/i-etc.svg';

import { useDispatch, useSelector } from '@store';
import { mainActions } from '@store/main';
import { configActions, configSelectors } from '@store/config';
import { bookmarksActions } from '@store/bookmarks';


import { useStoryRegions } from '@components/StoryRegionsProvider';
import { VisualHost } from '@components/VisualHost';

import { getNewValueForNarrativeTextStyle } from '@utils/styles/getNewValueForNarrativeTextStyle';

import { Item } from './components/Item';
import { Nav } from './components/Nav';

import * as styles from './Toolbar.module.scss';

export type ToolbarProps = {
  sbMode?: boolean;
};

export const Toolbar = ({ sbMode }: ToolbarProps) => {
  const dispatch = useDispatch();
  const { refs } = useStoryRegions();
  const fontSize = useSelector(configSelectors.fontSize);

  const dispatchSetFontSize = (isMoreAction: boolean) => {
    const fontSizeNewValue = getNewValueForNarrativeTextStyle(fontSize, isMoreAction);

    if (fontSizeNewValue === fontSize) {
      return;
    }

    dispatch(configActions.setFontSize(fontSizeNewValue));
  };

  const bookmarkClickHandler = () => {
    dispatch(bookmarksActions.setIsOpen(true));
  };

  const etcIconClickHandler = () => {
    dispatch(mainActions.setMenuActiveState('menu'));
  };

  const fontSmallClickHandler = () => {
    dispatchSetFontSize(false);
  };

  const fontBigClickHandler = () => {
    dispatchSetFontSize(true);
  };

  return (
    <div ref={refs.toolbarFrame} className={styles.ToolbarFrame} data-story-region="toolbarFrame">
      <div
        ref={refs.toolbar}
        id="Toolbar"
        className={styles.Toolbar}
        data-story-region="toolbar"
        data-story-toolbar
      >
        {!sbMode && (
          <>
            <Item data-welcome-tour-id="bookmarks" onClick={bookmarkClickHandler}>
              <BookmarkIcon />
            </Item>

            <Item data-welcome-tour-id="navigation">
              <Nav />
            </Item>
          </>
        )}

        <div data-welcome-tour-id="font" className={styles.FontSizeControlWrapper}>
          <Item onClick={fontSmallClickHandler}>
            <FontSmallIcon />
          </Item>

          <Item onClick={fontBigClickHandler}>
            <FontBigIcon />
          </Item>
        </div>

        <Item data-welcome-tour-id="config" onClick={etcIconClickHandler}>
          <EtcIcon />
        </Item>
        <VisualHost region="toolbar" />
      </div>

      <VisualHost region="toolbarFrame" />
    </div>
  );
};
