import type { PropsWithChildren, ReactNode, Ref } from 'react';
import { useEffect } from 'react';

import classNames from 'classnames';
import { setWasmUrl } from '@lottiefiles/dotlottie-react';
import { ToastContainer } from 'react-toastify';

import type { Config, RangeEffects, TableOfContents } from '@types';

import { useDispatch, useSelector } from '@store';

import { mainActions, mainSelectors } from '@store/main';
import { audioEffectsSelectors } from '@store/effects/audio/audio';
import { audioBgEffectsSelectors } from '@store/effects/audio/audioBg';
import { effectsSelectors } from '@store/effects/common';

import { useEffectsInRange } from '@hooks/effects/range';
import { useGoToPage } from '@hooks/control/useGoToPage';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';
import { BookVisualRoot } from '@components/BookVisualRoot';
import { useAppMode } from '@components/App/AppModeContext';

import { removeCssHover } from '@utils/touch/removeCssHover';
import { addKeyboardControl } from '@utils/control/keyboardControl';
import { hideAddressBarInMobileDevices } from '@utils/mobile/hideAddressBarInMobileDevices';

import {
  useAllPagesSeen,
  useBeforeUnloadHandler,
  useDeleteAllVideosWithoutDataIdOnThePage,
  useSetUpConfig,
  useVisibilityChangeHandler,
} from './hooks';

import { startToPlayAllAudiosWithPlayOnLoad, startToPlayAllVideosWithPlayOnLoad } from './utils';

import '@styles/common.scss';

import * as styles from './AppWrapper.module.scss';

export type AppWrapperProps = {
  config: Config;
  tableOfContents: TableOfContents;
  rangeEffects: RangeEffects;
  editorTools?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  visualSurfaces?: readonly VisualSurfaceItem[];
};

export const AppWrapper = ({
  children,
  config,
  tableOfContents,
  rangeEffects,
  editorTools,
  ref,
  visualSurfaces,
}: PropsWithChildren<AppWrapperProps>) => {
  const dispatch = useDispatch();
  const appMode = useAppMode();

  const { goPrevPage, goNextPage } = useGoToPage();

  const isLoading = useSelector(mainSelectors.isPending);
  const showLoader = useSelector(mainSelectors.showLoader);
  const page = useSelector(mainSelectors.page);
  const inverseColors = useSelector(effectsSelectors.inverseColorIsActive);
  const audioInstances = useSelector(audioEffectsSelectors.audioInstances);
  const audioInstancesBg = useSelector(audioBgEffectsSelectors.audioInstances);

  // применяю конфиг
  useSetUpConfig(config);

  // применяю оглавление
  useEffect(() => {
    dispatch(mainActions.setTableOfContents(tableOfContents));
  }, []);

  // приглушаю звук, отключаю вибрацию и вспышку, если приложение скрыто
  useVisibilityChangeHandler();

  // Сбрасывать адресную строку теперь не нужно, т.к. мы используем memoryRouter. вместо этого очищаем историю
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
  }, []);

  // если тач-устройство - убираю :hover
  useEffect(() => {
    removeCssHover();
  }, []);

  useEffect(() => {
    const canVibrate = !!navigator.vibrate;

    dispatch(mainActions.setIsVibrationAvailable(canVibrate));
  }, []);

  useEffect(() => {
    /*
      в эту директорию в dist-е клиента с помощью webpack нужно копировать этот файлик,
      иначе он будет загружаться с cdn
    */
    setWasmUrl('/vendors/dotlottie-player.wasm');
  }, []);

  // после полной загрузки страницы воспроизвожу все аудио, у которых playOnLoad = true
  useEffect(() => {
    if (isLoading) {
      return;
    }

    startToPlayAllAudiosWithPlayOnLoad(audioInstances, page);
    startToPlayAllAudiosWithPlayOnLoad(audioInstancesBg, page);
  }, [page, isLoading, audioInstances, audioInstancesBg]);

  // Удаляю id видео из списка currentTime, если видео с data-id на странице нет
  // todo: вспомнить зачем это вообще нужно
  useDeleteAllVideosWithoutDataIdOnThePage();

  useEffect(() => {
    if (appMode !== 'reader') {
      return;
    }

    // Фокус для прокрутки в режиме чтения. Не переносим его при обновлении навигационных колбэков.
    const narrativeElement = document.querySelector<HTMLElement>('#narrative');

    narrativeElement?.focus({ preventScroll: true });
  }, [appMode]);

  useEffect(() => {
    if (appMode !== 'reader') {
      return;
    }

    return addKeyboardControl(goPrevPage, goNextPage);
  }, [appMode, goPrevPage, goNextPage]);

  useEffect(() => {
    // addTouchSupportForCssHover(); // вместо этого просто "удаляю" :hover везде, возможно так и оставлю
    hideAddressBarInMobileDevices();
  }, []);

  /*
    начинаю воспроизведение video, у которых autoPlay.
    делаю это здесь, чтобы воспроизведение начиналось только после полной загрузки страницы
  */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    startToPlayAllVideosWithPlayOnLoad();
  }, [page, isLoading]);

  useAllPagesSeen();
  useBeforeUnloadHandler();
  useEffectsInRange(rangeEffects);

  const appWrapperClassNames = classNames({
    [styles.AppWrapper]: true,
    [styles.isLoading]: showLoader,
  });

  return (
    <>
      <div className={appWrapperClassNames}>
        <BookVisualRoot
          ref={ref}
          surfaces={visualSurfaces}
          inverseColors={inverseColors}
        >
          {children}
        </BookVisualRoot>

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
