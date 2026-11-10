import { createRoot } from 'react-dom/client';

import { MediaBook } from './MediaBook';
import '@active-book/common/styles';
import '../../src/styles/styles.scss';
createRoot(document.getElementById('root')!).render(<MediaBook />);
