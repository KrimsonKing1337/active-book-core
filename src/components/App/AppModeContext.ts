import { createContext, useContext } from 'react';

import type { AppMode } from '@types';

export const AppModeContext = createContext<AppMode>('reader');

export const useAppMode = (): AppMode => useContext(AppModeContext);
