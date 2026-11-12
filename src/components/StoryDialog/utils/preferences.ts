import type { BookDialogPreferences } from '@active-book/types';

export const dialogPreferencesKey = 'active-book:dialog-preferences';

export const defaultDialogPreferences: Readonly<BookDialogPreferences> = {
  isFullscreen: false,
  objectFit: 'contain',
};

let memoryPreferences = { ...defaultDialogPreferences };
let hasUnsavedPreferences = false;

const isBookDialogPreferences = (value: unknown): value is BookDialogPreferences => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (!('isFullscreen' in value) || typeof value.isFullscreen !== 'boolean') {
    return false;
  }

  if (!('objectFit' in value)) {
    return false;
  }

  return value.objectFit === 'contain' || value.objectFit === 'cover';
};

const parsePreferences = (raw: string): BookDialogPreferences => {
  try {
    const value: unknown = JSON.parse(raw);

    if (isBookDialogPreferences(value)) {
      return {
        isFullscreen: value.isFullscreen,
        objectFit: value.objectFit,
      };
    }
  } catch {
    // Некорректный JSON — используем настройки по умолчанию.
  }

  return { ...defaultDialogPreferences };
};

export const readDialogPreferences = (): BookDialogPreferences => {
  if (hasUnsavedPreferences) {
    return { ...memoryPreferences };
  }

  try {
    const raw = window.localStorage.getItem(dialogPreferencesKey);

    if (raw === null) {
      return { ...defaultDialogPreferences };
    }

    memoryPreferences = parsePreferences(raw);

    return { ...memoryPreferences };
  } catch {
    // Optional browser storage can be denied or contain invalid JSON; the reader remains usable.
    return { ...memoryPreferences };
  }
};

export const writeDialogPreferences = (preferences: BookDialogPreferences): void => {
  memoryPreferences = { ...preferences };

  try {
    window.localStorage.setItem(dialogPreferencesKey, JSON.stringify(preferences));

    hasUnsavedPreferences = false;
  } catch {
    // Keep reader preferences in memory when browser storage is unavailable or full.
    hasUnsavedPreferences = true;
  }
};
