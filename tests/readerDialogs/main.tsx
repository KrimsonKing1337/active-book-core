import { StrictMode } from 'react';

import { createRoot } from 'react-dom/client';

import { Fixture } from './Fixture';

import '@active-book/common/styles';
import '../../src/styles/styles.scss';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing reader dialog fixture root');
}

createRoot(root).render(<StrictMode><Fixture /></StrictMode>);
