import { useLayoutEffect, useState } from 'react';

import type { BookDialogPreferences } from '@active-book/types';

import { useAppMode } from '@components/App/AppModeContext';

import {
  defaultDialogPreferences,
  readDialogPreferences,
  writeDialogPreferences,
} from './preferences';

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
