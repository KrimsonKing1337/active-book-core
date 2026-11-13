import { useLayoutEffect } from 'react';

import { useDispatch } from '@store';
import { windowsActions } from '@store/windows';

import { Button } from '@components/Button';
import { StoryDialog } from '@components/StoryDialog';
import { useStoryWindowDialog } from '@components/StoryWindowHost/hooks';

import type { StoryConfirmDialogProps } from './@types';

import { useConfirmationCountdown } from './hooks';

import styles from './StoryConfirmDialog.module.scss';

export const StoryConfirmDialog = ({
  target,
  confirmationDelayMs = 0,
  allowDismiss = true,
  showCancelButton = true,
  confirmLabel = 'OK',
  cancelLabel = 'Отмена',
  children,

  onConfirm,
  onCancel,
  ...presentation
}: StoryConfirmDialogProps) => {
  const dispatch = useDispatch();

  const { dialogProps, isCurrentWindow } = useStoryWindowDialog(target);

  const instanceId = target?.instanceId;
  const sessionId = target?.sessionId;

  const secondsLeft = useConfirmationCountdown({ instanceId, delayMs: confirmationDelayMs });

  const canConfirm = dialogProps.isOpen && secondsLeft === 0;
  const canDismiss = canConfirm && allowDismiss;

  useLayoutEffect(() => {
    if (dialogProps.isOpen && sessionId && instanceId) {
      dispatch(windowsActions.setCanClose({
        sessionId,
        instanceId,
        canClose: canDismiss,
      }));
    }
  }, [dialogProps.isOpen, sessionId, instanceId, canDismiss, dispatch]);

  const handleConfirm = () => {
    if (canConfirm && isCurrentWindow()) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!canDismiss || !isCurrentWindow()) {
      return;
    }

    if (onCancel) {
      onCancel();
    } else {
      dialogProps.onOpenChange(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleCancel();
    }
  };

  let confirmText = confirmLabel;
  let cancelText = cancelLabel;

  if (secondsLeft > 0) {
    confirmText = `${confirmLabel} (${secondsLeft})`;
    cancelText = `${cancelLabel} (${secondsLeft})`;
  }

  return (
    <StoryDialog
      {...presentation}
      {...dialogProps}
      canClose={canDismiss}
      onOpenChange={handleOpenChange}
    >
      {children}

      <div className={styles.Actions}>
        <Button type="success" disabled={!canConfirm} onClick={handleConfirm}>
          {confirmText}
        </Button>

        {showCancelButton && (
          <Button type="secondary" disabled={!canDismiss} onClick={handleCancel}>
            {cancelText}
          </Button>
        )}
      </div>
    </StoryDialog>
  );
};
