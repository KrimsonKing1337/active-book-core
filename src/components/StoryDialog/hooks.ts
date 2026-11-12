import {
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { BookDialogPreferences } from '@active-book/types';

import { useAppMode } from '@components/App/AppModeContext';

import type { StoryDialogProps } from './@types';

import {
  defaultDialogPreferences,
  readDialogPreferences,
  writeDialogPreferences,
} from './utils';

export const useDialogPreferences = (isOpen: boolean) => {
  const appMode = useAppMode();

  const [preferences, setPreferences] = useState<BookDialogPreferences>(() => {
    if (appMode === 'reader') {
      return readDialogPreferences();
    }

    return { ...defaultDialogPreferences };
  });

  useLayoutEffect(() => {
    if (isOpen && appMode === 'reader') {
      setPreferences(readDialogPreferences());
    }
  }, [isOpen, appMode]);

  const changePreferences = (next: BookDialogPreferences) => {
    setPreferences(next);

    if (appMode === 'reader') {
      writeDialogPreferences(next);
    }
  };

  const toggleFullscreen = () => {
    changePreferences({
      ...preferences,
      isFullscreen: !preferences.isFullscreen,
    });
  };

  const toggleObjectFit = () => {
    let objectFit: BookDialogPreferences['objectFit'] = 'cover';

    if (preferences.objectFit === 'cover') {
      objectFit = 'contain';
    }

    changePreferences({ ...preferences, objectFit });
  };

  return {
    preferences,
    toggleFullscreen,
    toggleObjectFit,
  };
};

type DialogFocusOptions = Pick<StoryDialogProps, 'returnFocusRef' | 'fallbackFocusRef' | 'onCloseAutoFocus'>;

export const useDialogFocus = ({
  returnFocusRef,
  fallbackFocusRef,
  onCloseAutoFocus,
}: DialogFocusOptions) => {
  const openerRef = useRef<HTMLElement | null>(null);

  const handleOpenAutoFocus = () => {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      openerRef.current = activeElement;
    }
  };

  const handleCloseAutoFocus = (event: Event) => {
    onCloseAutoFocus?.(event);

    if (event.defaultPrevented) {
      return;
    }

    let target = returnFocusRef?.current ?? openerRef.current;

    if (!target?.isConnected || target.closest('[inert]')) {
      target = fallbackFocusRef?.current ?? null;
    }

    if (target?.isConnected && !target.closest('[inert]')) {
      event.preventDefault();
      target.focus({ preventScroll: true });
    }
  };

  return { handleOpenAutoFocus, handleCloseAutoFocus };
};
