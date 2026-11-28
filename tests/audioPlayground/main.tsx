import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { AudioPlayground } from './AudioPlayground';

import '@active-book/common/styles';
import '@styles/styles.scss';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing audio playground root');
}

createRoot(root).render(
  <StrictMode>
    <AudioPlayground />
  </StrictMode>,
);
