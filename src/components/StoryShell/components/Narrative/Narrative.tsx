import { PropsWithChildren, useEffect, useLayoutEffect, useRef } from 'react';

import Hammer from 'hammerjs';

import { configSelectors } from '@store/config';
import { fontEffectsSelectors } from '@store/effects/font';

import { useSelector } from '@store';

import { mainSelectors } from '@store/main';

import { useGoToPage } from '@hooks/control/useGoToPage';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { VisualHost } from '@components/VisualHost';

import { useAppMode } from '@components/App/AppModeContext';

import * as styles from './Narrative.module.scss';

export const Narrative = ({ children }: PropsWithChildren) => {
  const appMode = useAppMode();
  const { refs } = useStoryRegions();
  const { goNextPage, goPrevPage } = useGoToPage();

  const currentPage = useSelector(mainSelectors.page);
  const pageId = useSelector(mainSelectors.pageId);
  const contentHadFocusRef = useRef(false);

  // const fontSize = useSelector(configSelectors.fontSize);
  const lineHeight = useSelector(configSelectors.lineHeight);

  const fontColor = useSelector(fontEffectsSelectors.color);
  const fontStyle = useSelector(fontEffectsSelectors.style);

  const narrativeStyle = {
    // fontSize: `${fontSize}%`,
    color: fontColor,
  };

  const textStyle = {
    lineHeight: `${lineHeight}%`,
    ...fontStyle,
  };

  const ref = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(0);

  useLayoutEffect(() => {
    const element = ref.current;

    if (element) {
      element.scrollTop = 0;

      if (appMode === 'reader' && contentHadFocusRef.current && document.activeElement === document.body) {
        element.focus({ preventScroll: true });
      }
    }

    contentHadFocusRef.current = false;
  }, [pageId, appMode]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    if (appMode !== 'reader') {
      return;
    }

    // Переводим фокус для прокрутки только в режиме чтения.
    ref.current?.focus();
  }, [appMode]);

  useEffect(() => {
    if (appMode !== 'reader' || !ref.current || currentPageRef.current === 0) {
      return;
    }

    const hammertime = new Hammer(ref.current, { domEvents: true });

    hammertime.get('swipe').set({
      direction: Hammer.DIRECTION_HORIZONTAL,
      threshold: 50,
    });

    hammertime.on('swipe', (e) => {
      if (e.target instanceof Element && e.target.closest('[data-book-carousel]')) {
        return;
      }

      const { direction } = e;

      const isNext = direction === Hammer.DIRECTION_LEFT;

      if (isNext) {
        goNextPage();
      } else {
        goPrevPage();
      }
    });

    return () => {
      hammertime.off('swipe');
      hammertime.destroy();
    };
  }, [appMode, goNextPage, goPrevPage]);

  return (
    <div ref={refs.narrativeViewport} className={styles.Viewport} data-story-region="narrativeViewport">
      <div
        ref={ref}
        id="narrative"
        className={styles.Narrative}
        style={narrativeStyle}
        tabIndex={0}
        onFocusCapture={() => {
          contentHadFocusRef.current = true;
        }}
        onBlurCapture={(e) => {
          if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) {
            contentHadFocusRef.current = false;
          }
        }}
      >
        <div
          ref={refs.narrativeContent}
          className="Narrative__Text"
          style={textStyle}
          data-story-region="narrativeContent"
        >
          <div className={styles.Text}>
            {children}
          </div>
          <VisualHost region="narrativeContent" />
        </div>
      </div>
      <VisualHost region="narrativeViewport" />
    </div>
  );
};
