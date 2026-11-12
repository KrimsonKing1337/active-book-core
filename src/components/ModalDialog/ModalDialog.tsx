import type { PropsWithChildren } from 'react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import type { ModalProps } from '@components/Modal';

import { Modal } from '@components/Modal';
import { Button } from '@components/Button';

import * as styles from './ModalDialog.module.scss';

type Func = () => void;

export type ModalDialogProps = ModalProps & {
  cantCloseIn?: number;
  showConfirmButton?: boolean;
  confirmButtonLabel?: string;
  showCancelButton?: boolean;
  cancelButtonLabel?: string;

  onConfirm?: Func;
  onCancel?: Func;
};

const defaultFunc = () => {};

export const ModalDialog = ({
  isOpen,
  windowTarget,
  cantCloseIn = 0,
  showConfirmButton = true,
  confirmButtonLabel = 'OK',
  cancelButtonLabel = 'Отмена',
  showCancelButton = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClose = defaultFunc,
  onConfirm = defaultFunc,
  onCancel = defaultFunc,
  children,
  ...etc
}: PropsWithChildren<ModalDialogProps>) => {
  const [unlockedInstanceId, setUnlockedInstanceId] = useState<string | null>(null);
  const instanceId = windowTarget?.instanceId ?? 'standalone';
  const canClose = unlockedInstanceId === instanceId;
  const [secondsLeft, setSecondsLeft] = useState(0);

  const secondsLeftRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const interval = setInterval(() => {
      if (secondsLeftRef.current <= 0) {
        if (interval) {
          clearInterval(interval);
        }

        return;
      }

      secondsLeftRef.current = secondsLeftRef.current - 1;
      setSecondsLeft(secondsLeftRef.current);
    }, 1000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    setUnlockedInstanceId(null);

    if (!isOpen) {
      return;
    }

    secondsLeftRef.current = cantCloseIn / 1000;

    setSecondsLeft(secondsLeftRef.current);

    const timer = setTimeout(() => {
      setUnlockedInstanceId(instanceId);
    }, cantCloseIn);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isOpen, cantCloseIn, instanceId]);

  const confirmButtonClickHandler = () => {
    if (canClose) {
      onConfirm();
    }
  };

  const cancelButtonClickHandler = () => {
    onCancel();
  };

  const closeHandler = () => {
    onCancel();
  };

  let confirmBtnLabel = confirmButtonLabel;
  let cancelBtnLabel = cancelButtonLabel;

  if (secondsLeft) {
    confirmBtnLabel = `${confirmButtonLabel} (${secondsLeft})`;
    cancelBtnLabel = `${cancelButtonLabel} (${secondsLeft})`;
  }

  return (
    <Modal
      isOpen={isOpen}
      windowTarget={windowTarget}
      canClose={canClose}
      onClose={closeHandler}
      {...etc}
    >
      <div className={styles.Wrapper}>
        <div className="ModalDialogDesc">
          {children}
        </div>

        <div className={styles.Actions}>
          {showConfirmButton && (
            <Button type="success" disabled={!canClose} onClick={confirmButtonClickHandler}>
              {confirmBtnLabel}
            </Button>
          )}

          {showCancelButton && (
            <Button type="secondary" disabled={!canClose} onClick={cancelButtonClickHandler}>
              {cancelBtnLabel}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
