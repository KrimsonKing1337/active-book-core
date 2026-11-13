import {
  useCallback,
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

export const usePresentationFocus = () => {
  const fullscreenRef = useRef<HTMLButtonElement>(null);
  const fitRef = useRef<HTMLButtonElement | null>(null);
  const setFitRef = useCallback((element: HTMLButtonElement | null) => {
    if (!element && fitRef.current === document.activeElement) {
      fullscreenRef.current?.focus({ preventScroll: true });
    }

    fitRef.current = element;
  }, []);

  return { fullscreenRef, setFitRef };
};

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

    openerRef.current = null;

    // Replacing a locally rendered dialog can remove the old focused node before this scope mounts.
    // Body/documentElement are not meaningful return targets; use the story viewport instead.
    const hasOpener = activeElement instanceof HTMLElement &&
      activeElement !== document.body && activeElement !== document.documentElement;

    if (hasOpener) {
      openerRef.current = activeElement;
    }
  };

  const handleCloseAutoFocus = (e: Event) => {
    onCloseAutoFocus?.(e);

    if (e.defaultPrevented) {
      return;
    }

    let target = returnFocusRef?.current ?? openerRef.current;

    if (!target?.isConnected || target.closest('[inert]')) {
      target = fallbackFocusRef?.current ?? null;
    }

    if (target?.isConnected && !target.closest('[inert]')) {
      e.preventDefault();

      const previousActiveElement = document.activeElement;

      target.focus({ preventScroll: true });

      // A connected opener may have become hidden/unfocusable while its dialog was open.
      // Do not override focus if another actor already moved it during the focus event.
      const focusDidNotMove =
        document.activeElement === previousActiveElement
        && document.activeElement !== target;

      const fallback = fallbackFocusRef?.current;
      const isFallbackFocusAvailable = fallback?.isConnected && !fallback.closest('[inert]');

      if (focusDidNotMove && isFallbackFocusAvailable) {
        fallback.focus({ preventScroll: true });
      }
    }
  };

  return { handleOpenAutoFocus, handleCloseAutoFocus };
};
