import { createRoot } from 'react-dom/client';

import { TestBook } from './TestBook';

import '../../src/styles/styles.scss';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing test root');
}

createRoot(root).render(<TestBook />);
