import type { PropsWithChildren, FocusEvent } from 'react';

import {
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import Hammer from 'hammerjs';

import { configSelectors } from '@store/config';
import { fontEffectsSelectors } from '@store/effects/font';

import { useSelector } from '@store';

import { mainSelectors } from '@store/main';

import { useReaderNavigation } from '@hooks/control/useReaderNavigation';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { VisualHost } from '@components/VisualHost';

import { useAppMode } from '@components/App/AppModeContext';

import * as styles from './Narrative.module.scss';

export const Narrative = ({ children }: PropsWithChildren) => {
  const appMode = useAppMode();
  const { refs } = useStoryRegions();
  const { goNextPage, goPrevPage } = useReaderNavigation();

  const currentPage = useSelector(mainSelectors.page);
  const pageId = useSelector(mainSelectors.pageId);
  const visit = useSelector(mainSelectors.visit);
  const showLoader = useSelector(mainSelectors.showLoader);

  const isAwaitingReveal = visit !== null && !visit.reveal;
  const isLoading = showLoader || isAwaitingReveal;
  const locked = appMode === 'reader' && isLoading;

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

  useLayoutEffect(() => {
    const element = ref.current;

    if (element) {
      element.scrollTop = 0;

      const isBodyFocused = document.activeElement === document.body;

      if (appMode === 'reader' && contentHadFocusRef.current && isBodyFocused) {
        element.focus({ preventScroll: true });
      }
    }

    contentHadFocusRef.current = false;
  }, [pageId, appMode]);

  useEffect(() => {
    const isBodyFocused = document.activeElement === document.body;

    if (appMode === 'reader' && !locked && isBodyFocused) {
      ref.current?.focus({ preventScroll: true });
    }
  }, [appMode, locked]);

  useEffect(() => {
    if (appMode !== 'reader' || !ref.current || currentPage === 0) {
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
  }, [
    appMode,
    currentPage,
    goNextPage,
    goPrevPage,
  ]);

  const handleFocusCapture = () => {
    contentHadFocusRef.current = true;
  };

  const handleBlurCapture = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) {
      contentHadFocusRef.current = false;
    }
  };

  return (
    <div
      ref={refs.narrativeViewport}
      className={styles.Viewport}
      data-story-region="narrativeViewport"
    >
      <div
        ref={ref}
        id="narrative"
        className={styles.Narrative}
        style={narrativeStyle}
        tabIndex={0}
        inert={locked}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
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
