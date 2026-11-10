import { createRoot } from 'react-dom/client';

import { PlacementBook } from './PlacementBook';

import '@active-book/common/styles';
import '@styles/styles.scss';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing test root');
}

createRoot(root).render(<PlacementBook />);
