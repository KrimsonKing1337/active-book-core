import {
  defaultDialogPreferences,
  dialogPreferencesKey,
  readDialogPreferences,
  writeDialogPreferences,
} from '../utils';

beforeEach(() => {
  jest.restoreAllMocks();
  writeDialogPreferences({ ...defaultDialogPreferences });
  localStorage.clear();
});

afterEach(() => jest.restoreAllMocks());

test('shares only reader preferences independently of authored geometry', () => {
  expect(readDialogPreferences()).toEqual(defaultDialogPreferences);

  writeDialogPreferences({ isFullscreen: true, objectFit: 'cover' });

  expect(readDialogPreferences()).toEqual({ isFullscreen: true, objectFit: 'cover' });
  expect(JSON.parse(localStorage.getItem(dialogPreferencesKey) ?? '')).toEqual({
    isFullscreen: true,
    objectFit: 'cover',
  });
});

test.each([
  'invalid JSON',
  'null',
  '{"isFullscreen":"true","objectFit":"cover"}',
  '{"isFullscreen":true,"objectFit":"fill"}',
])('safely handles malformed storage: %s', (raw) => {
  localStorage.setItem(dialogPreferencesKey, raw);

  expect(readDialogPreferences()).toEqual(defaultDialogPreferences);
});

test('continues in memory if the localStorage getter throws', () => {
  jest.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('Storage denied', 'SecurityError');
  });

  expect(() => writeDialogPreferences({ isFullscreen: true, objectFit: 'cover' })).not.toThrow();
  expect(readDialogPreferences()).toEqual({ isFullscreen: true, objectFit: 'cover' });
});

test('continues in memory when storage quota is exhausted', () => {
  writeDialogPreferences({ isFullscreen: true, objectFit: 'contain' });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Quota exhausted', 'QuotaExceededError');
  });
  writeDialogPreferences({ isFullscreen: false, objectFit: 'cover' });

  expect(readDialogPreferences()).toEqual({ isFullscreen: false, objectFit: 'cover' });
});
