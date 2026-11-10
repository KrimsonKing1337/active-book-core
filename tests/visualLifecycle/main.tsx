import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { LifecycleBook } from './LifecycleBook';

import '@active-book/common/styles';
import '../../src/styles/styles.scss';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing test root');
}

const isStrict = new URLSearchParams(window.location.search).has('strict');
const book = <LifecycleBook />;
const strictBook = (
  <StrictMode>
    {book}
  </StrictMode>
);

createRoot(root).render(isStrict ? strictBook : book);
