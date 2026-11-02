import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { StoreProvider } from '../../src/store';
import { EffectsBook } from './EffectsBook';

import '../../src/styles/styles.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <EffectsBook />
    </StoreProvider>
  </StrictMode>,
);
