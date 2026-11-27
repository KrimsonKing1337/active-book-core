import {
  type PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';

import classNames from 'classnames';
import { ToastContainer } from 'react-toastify';

import { useDispatch, useSelector } from '@store';

import { mainActions, mainSelectors } from '@store/main';
import { effectsSelectors } from '@store/effects/common';

import type { VisualEffects } from '@controllers/visualEffects';

import { useVisualRegistrations } from '@controllers/visualEffects';

import { useReaderNavigation } from '@hooks/control/useReaderNavigation';

import { BookApplicationSurface, useBookApplicationSurface } from '@components/BookApplicationSurface';

import { StoryRoot } from '@components/StoryRoot';
import { StoryShell } from '@components/StoryShell';
import { StoryContent } from '@components/StoryContent';
import { useAppMode } from '@components/App/AppModeContext';

import { removeCssHover } from '@utils/touch/removeCssHover';
import { addKeyboardControl } from '@utils/control/keyboardControl';
import { hideAddressBarInMobileDevices } from '@utils/mobile/hideAddressBarInMobileDevices';

import type { AppWrapperProps } from '../../@types';

import {
  useAllPagesSeen,
  useBeforeUnloadHandler,
  useDeleteAllVideosWithoutDataIdOnThePage,
  useSetUpConfig,
  useVisibilityChangeHandler,
} from '../../hooks';

import * as styles from '../../AppWrapper.module.scss';

export type AppContentProps = PropsWithChildren & AppWrapperProps & {
  visualEffects: VisualEffects;
};

export const AppContent = ({
  children,
  storyPages,
  withoutToolbar,
  config,
  tableOfContents,
  editorTools,
  ref,
  visualSurfaces,
  visualEffects,
  registrations,
  definitions,
  hiddenVisualEffects,
  selectedVisualEffectId,
}: AppContentProps) => {
  const dispatch = useDispatch();

  const application = useBookApplicationSurface();

  const pageId = useSelector(mainSelectors.pageId);

  const selectedPage = storyPages.find((cur) => cur.id === pageId);
  const previousPageIds = useRef<readonly string[] | null>(null);

  useLayoutEffect(() => {
    const ids = storyPages.map((cur) => cur.id);
    const prevIds = previousPageIds.current;

    const amountIsEqual = prevIds?.length === ids.length;

    const everyIdIsEqual = ids.every((idCur, index) => {
      if (!prevIds) {
        return;
      }

      return idCur === prevIds[index];
    });

    if (amountIsEqual && everyIdIsEqual) {
      return;
    }

    const idsAreUnique = new Set(ids).size === ids.length;
    const idsAreNonEmpty = ids.every((cur) => !!cur);

    if (!idsAreUnique || !idsAreNonEmpty) {
      throw new Error('Story pages require unique non-empty IDs');
    }

    previousPageIds.current = ids;

    dispatch(mainActions.setStoryPages(ids));
  }, [storyPages, dispatch]);

  useLayoutEffect(() => {
    visualEffects.setPageCount(storyPages.length);
  }, [storyPages.length, visualEffects]);

  useVisualRegistrations({
    session: visualEffects,
    registrations,
    definitions,
  });

  const appMode = useAppMode();

  const { goPrevPage, goNextPage } = useReaderNavigation();

  const canPlayAudio = useSelector(mainSelectors.isAudioUnlocked);
  const showLoader = useSelector(mainSelectors.showLoader);
  const page = useSelector(mainSelectors.page);
  const inverseColors = useSelector(effectsSelectors.inverseColorIsActive);
  // применяю конфиг
  useSetUpConfig(config);

  // применяю оглавление
  useEffect(() => {
    dispatch(mainActions.setTableOfContents(tableOfContents));
  }, []);

  // приглушаю звук, отключаю вибрацию и вспышку, если приложение скрыто
  useVisibilityChangeHandler();

  // если тач-устройство - убираю :hover
  useEffect(() => {
    removeCssHover();
  }, []);

  useEffect(() => {
    const canVibrate = !!navigator.vibrate;

    dispatch(mainActions.setIsVibrationAvailable(canVibrate));
  }, []);

  useEffect(() => {
    if (appMode !== 'reader' || canPlayAudio) {
      return;
    }

    const unlock = (event: Event) => {
      if (event.isTrusted) {
        dispatch(mainActions.setIsAudioUnlocked(true));
      }
    };
    const events = [
      'click',
      'pointerup',
      'touchend',
      'keydown',
    ];

    events.forEach((eventCur) => {
      window.addEventListener(eventCur, unlock);
    });

    return () => {
      events.forEach((eventCur) => {
        window.removeEventListener(eventCur, unlock);
      });
    };
  }, [
    appMode,
    canPlayAudio,
    dispatch,
  ]);

  // Удаляю id видео из списка currentTime, если видео с data-id на странице нет
  // todo: вспомнить зачем это вообще нужно
  useDeleteAllVideosWithoutDataIdOnThePage();

  useEffect(() => {
    if (appMode !== 'reader') {
      return;
    }

    return addKeyboardControl(goPrevPage, goNextPage);
  }, [
    appMode,
    goPrevPage,
    goNextPage,
  ]);

  useEffect(() => {
    // addTouchSupportForCssHover(); // вместо этого просто "удаляю" :hover везде, возможно так и оставлю
    hideAddressBarInMobileDevices();
  }, []);

  useAllPagesSeen();
  useBeforeUnloadHandler();

  const appWrapperClassNames = classNames({
    [styles.AppWrapper]: true,
    [styles.isLoading]: showLoader,
  });

  const dataPageId = pageId ?? undefined;
  const storyContentKey = pageId === null ? 'start' : `page:${pageId}`;
  const storyContentChildren = pageId === null ? children : selectedPage?.content;

  const story = (
    <StoryRoot
      ref={ref}
      surfaces={visualSurfaces}
      visualEffects={visualEffects}
      page={page}
      hiddenVisualEffects={hiddenVisualEffects}
      selectedVisualEffectId={selectedVisualEffectId}
      inverseColors={inverseColors}
    >
      <StoryShell
        withoutToolbar={withoutToolbar}
        data-page-id={dataPageId}
      >
        <StoryContent key={storyContentKey}>
          {storyContentChildren}
        </StoryContent>
      </StoryShell>
    </StoryRoot>
  );

  return (
    <>
      <div className={appWrapperClassNames}>
        {application ? story : (
          <BookApplicationSurface>
            {story}
          </BookApplicationSurface>
        )}

        {editorTools}
      </div>

      <ToastContainer
        hideProgressBar
        pauseOnHover
        closeOnClick
        theme="colored"
      />
    </>
  );
};
