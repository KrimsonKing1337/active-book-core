import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { Playground } from './Playground';

import '@styles/styles.scss';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing playground root');
}

createRoot(root).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
