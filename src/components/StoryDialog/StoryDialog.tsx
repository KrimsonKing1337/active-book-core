import * as Dialog from '@radix-ui/react-dialog';
import classNames from 'classnames';

import type { StoryDialogProps } from './@types';

import { getDialogDimension } from './utils';
import { useDialogFocus, useDialogPreferences } from './hooks';

import styles from './StoryDialog.module.scss';

export const StoryDialog = ({
  children,
  isOpen,
  title,
  description,
  mode = 'default',
  width,
  height,
  canClose = true,
  container,
  returnFocusRef,
  fallbackFocusRef,

  onOpenChange,
  onCloseAutoFocus,
}: StoryDialogProps) => {
  const { handleOpenAutoFocus, handleCloseAutoFocus } = useDialogFocus({
    returnFocusRef,
    fallbackFocusRef,
    onCloseAutoFocus,
  });

  const {
    preferences,
    toggleFullscreen,
    toggleObjectFit,
  } = useDialogPreferences(isOpen);

  const { isFullscreen, objectFit } = preferences;

  const authoredWidth = getDialogDimension(width);
  const authoredHeight = getDialogDimension(height);

  let displayedWidth = authoredWidth;
  let displayedHeight = authoredHeight;

  let fullscreenLabel = 'Развернуть окно';

  if (isFullscreen) {
    displayedWidth = '100%';
    displayedHeight = '100%';
    fullscreenLabel = 'Вернуть размер окна';
  }

  const contentStyle = {
    width: displayedWidth,
    height: displayedHeight,
    '--story-dialog-object-fit': objectFit,
  };

  const contentClasses = classNames(styles.Content, {
    [styles.Fullscreen]: isFullscreen,
  });

  const bodyClasses = classNames(styles.Body, {
    [styles.Media]: mode === 'media',
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen || canClose) {
      onOpenChange(nextOpen);
    }
  };

  const handleDismiss = (e: Event) => {
    if (!canClose) {
      e.preventDefault();
    }
  };

  if (!container) {
    return null;
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal container={container}>
        <div className={styles.Layer} data-story-dialog-layer>
          <Dialog.Overlay className={styles.Overlay} />

          <Dialog.Content
            className={contentClasses}
            style={contentStyle}
            aria-modal="true"
            data-book-window-open={isOpen}
            data-mode={mode}
            data-fullscreen={isFullscreen}
            data-object-fit={objectFit}

            onEscapeKeyDown={handleDismiss}
            onInteractOutside={handleDismiss}
            onOpenAutoFocus={handleOpenAutoFocus}
            onCloseAutoFocus={handleCloseAutoFocus}
          >
            <div className={styles.Toolbar}>
              <Dialog.Title className={styles.Title}>
                {title}
              </Dialog.Title>

              <button type="button" aria-pressed={isFullscreen} onClick={toggleFullscreen}>
                {fullscreenLabel}
              </button>

              {mode === 'media' && (
                <button type="button" aria-pressed={objectFit === 'cover'} onClick={toggleObjectFit}>
                  Заполнить область
                </button>
              )}

              {canClose && (
                <Dialog.Close>
                  Закрыть
                </Dialog.Close>
              )}
            </div>

            {description && (
              <Dialog.Description className={styles.Description}>
                {description}
              </Dialog.Description>
            )}

            <div className={bodyClasses}>
              {children}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
