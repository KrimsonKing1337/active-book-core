import type { PropsWithChildren } from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import Hammer from 'hammerjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCompress,
  faCrop,
  faExpand,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

import type { WindowTarget } from '@store/windows';

import { useDispatch } from '@store';
import { windowsActions } from '@store/windows';

import { useAppMode } from '@components/App/AppModeContext';

import * as styles from './Modal.module.scss';

type Func = () => void;

type ModalMode = 'media' | 'text';

export type ModalProps = {
  isOpen: boolean;
  windowTarget?: WindowTarget;
  onClose?: Func;
  mode?: ModalMode;
  canClose?: boolean;
  canFullScreen?: boolean;
  fullScreenDefault?: boolean;
  canCrop?: boolean;
  cropDefault?: boolean;
};

export const Modal = ({
  children,
  onClose,
  windowTarget,
  isOpen,
  mode = 'text',
  canClose = true,
  canFullScreen = false,
  fullScreenDefault = false,
  canCrop = false,
  cropDefault = true,
}: PropsWithChildren<ModalProps>) => {
  const appMode = useAppMode();
  const dispatch = useDispatch();
  // здесь реф-версии нужны для хаммера, обычные для того чтобы ре-рендер срабатывал
  const isFullScreenRef = useRef(false);
  const isCropRef = useRef(true);
  const isZoomingRef = useRef(false);

  const [isFullScreen, setIsFullScreen] = useState(fullScreenDefault);
  const [isCrop, setIsCrop] = useState(cropDefault);

  const overflowRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iconCloseRef = useRef<HTMLDivElement>(null);
  const iconExpandRef = useRef<HTMLDivElement>(null);
  const iconCompressRef = useRef<HTMLDivElement>(null);
  const iconCropRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    if (!canClose) {
      return;
    }

    onClose?.();
  }, [canClose, onClose]);

  const targetSessionId = windowTarget?.sessionId;
  const targetInstanceId = windowTarget?.instanceId;

  useLayoutEffect(() => {
    if (isOpen && targetSessionId && targetInstanceId) {
      dispatch(windowsActions.setCanClose({
        sessionId: targetSessionId,
        instanceId: targetInstanceId,
        canClose,
      }));
    }
  }, [isOpen, targetSessionId, targetInstanceId, canClose, dispatch]);

  useEffect(() => {
    if (!isOpen || appMode !== 'reader') {
      return;
    }

    const escPressHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', escPressHandler);

    return () => {
      document.removeEventListener('keydown', escPressHandler);
    };
  }, [appMode, isOpen, close]);

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const wrapperWidth = wrapperRef.current.clientWidth;

    const applyStyleLeftForElement = (element: HTMLDivElement) => {
      element.style.left = `${wrapperWidth}px`;
    };

    const iconClose = iconCloseRef.current;
    const iconExpand = iconExpandRef.current;
    const iconCompress = iconCompressRef.current;
    const iconCrop = iconCropRef.current;

    if (!iconClose || !iconExpand || !iconCompress || !iconCrop) {
      return;
    }

    const arr = [iconClose, iconExpand, iconCompress, iconCrop];

    arr.forEach((cur) => applyStyleLeftForElement(cur));
  }, [isOpen]);

  useEffect(() => {
    if (!overflowRef.current) {
      return;
    }

    const hammertime = new Hammer(overflowRef.current);

    hammertime.get('tap').set({
      taps: 2,
    });

    hammertime.get('pinch').set({
      enable: true,
      threshold: 0.5,
    });

    hammertime.on('tap', doubleTapHandler);
    hammertime.on('pinchout', zoomInHandler);
    hammertime.on('pinchin', zoomOutHandler);

    hammertime.on('pinchend pinchcancel', () => {
      isZoomingRef.current = false;
    });

    return () => {
      isZoomingRef.current = false;

      hammertime.off('tap');
      hammertime.off('pinch');
      hammertime.destroy();
    };
  }, []);

  const closeIconClickHandler = () => close();
  const overflowClickHandler = () => close();

  const doubleTapHandler = () => {
    if (!canFullScreen) {
      return;
    }

    isFullScreenRef.current = !isFullScreenRef.current;
    setIsFullScreen(isFullScreenRef.current);
  };

  const zoomInHandler = () => {
    if (!canFullScreen) {
      return;
    }

    if (!isFullScreenRef.current) {
      isZoomingRef.current = true;

      isFullScreenRef.current = true;
      setIsFullScreen(true);

      return;
    }

    if (!canCrop) {
      return;
    }

    if (!isZoomingRef.current) {
      isCropRef.current = true;
      setIsCrop(true);
    }
  };

  const zoomOutHandler = () => {
    if (isCropRef.current) {
      isZoomingRef.current = true;

      isCropRef.current = false;
      setIsCrop(false);

      return;
    }

    if (!isZoomingRef.current) {
      isFullScreenRef.current = false;
      setIsFullScreen(false);
    }
  };

  const iconExpandClickHandler = () => {
    isFullScreenRef.current = true;
    setIsFullScreen(true);
  };

  const iconCompressClickHandler = () => {
    isFullScreenRef.current = false;
    setIsFullScreen(false);
  };

  const iconCropClickHandler = () => {
    isCropRef.current = !isCropRef.current;
    setIsCrop(!isCrop);
  };

  const isMediaMode = mode === 'media';

  const overflowClassNames = classNames({
    [styles.Overflow]: true,
    [styles.isOpen]: isOpen,
  });

  const modalClassNames = classNames({
    [styles.Modal]: true,
    [styles.isFullScreen]: isFullScreen,
    [styles.isMediaMode]: isMediaMode,
  });

  const iconExpandClassNames = classNames({
    [styles.IconExpand]: true,
    [styles.isFullScreen]: isFullScreen,
    [styles.isMediaMode]: isMediaMode,
    [styles.isHidden]: !canFullScreen,
  });

  const iconCloseClassNames = classNames({
    [styles.IconClose]: true,
    [styles.canClose]: canClose,
    [styles.isMediaMode]: isMediaMode,
    [styles.isFullScreen]: isFullScreen,
  });

  const iconCompressClassNames = classNames({
    [styles.IconCompress]: true,
    [styles.isFullScreen]: isFullScreen,
    [styles.isMediaMode]: isMediaMode,
  });

  const iconCropClassNames = classNames({
    [styles.IconCrop]: true,
    [styles.isFullScreen]: isFullScreen,
    [styles.isMediaMode]: isMediaMode,
    [styles.isHidden]: !canCrop,
  });

  const contentClassNames = classNames({
    [styles.Content]: true,
    [styles.isFullScreen]: isFullScreen,
    [styles.isMediaMode]: isMediaMode,
    [styles.isCrop]: isCrop,
  });

  return (
    <div
      ref={overflowRef}
      className={overflowClassNames}
      data-book-window-open={isOpen}
      onClick={overflowClickHandler}
    >
      <div ref={wrapperRef} className={modalClassNames}>
        <div className={styles.Wrapper} onClick={(e) => e.stopPropagation()}>
          <div className="modalToolbar">
            <div ref={iconCloseRef} className={iconCloseClassNames} onClick={closeIconClickHandler}>
              <FontAwesomeIcon icon={faTimes} />
            </div>

            <div ref={iconExpandRef} className={iconExpandClassNames} onClick={iconExpandClickHandler}>
              <FontAwesomeIcon icon={faExpand} />
            </div>

            <div ref={iconCompressRef} className={iconCompressClassNames} onClick={iconCompressClickHandler}>
              <FontAwesomeIcon icon={faCompress} />
            </div>

            <div ref={iconCropRef} className={iconCropClassNames} onClick={iconCropClickHandler}>
              <FontAwesomeIcon icon={faCrop} />
            </div>
          </div>

          <div className={contentClassNames}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
