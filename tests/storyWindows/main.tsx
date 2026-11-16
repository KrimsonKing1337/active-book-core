import {
  StrictMode,
  useEffect,
  useState,
} from 'react';

import { createRoot } from 'react-dom/client';

import type { Config } from '../../src/@types';

import { StoreProvider } from '../../src/store';
import { AppWrapper } from '../../src/components/AppWrapper';

import { api } from './api';
import { WindowPage } from './WindowPage';

import '@active-book/common/styles';
import '../../src/styles/styles.scss';

const config: Config = {
  id: 'story-windows-fixture',
  pages: 2,
  defaultTheme: 'dark',
};

const Fixture = () => {
  const [visible, setVisible] = useState(true);
  const [bookKey, setBookKey] = useState(0);

  useEffect(() => {
    api.setVisible = setVisible;
    api.renew = () => setBookKey((previous) => previous + 1);
  }, []);

  return (
    <StoreProvider>
      {visible && (
        <AppWrapper
          config={config}
          bookKey={bookKey}
          initialPageId="page-a"
          withoutToolbar
          storyPages={[
            { id: 'page-a', content: <WindowPage pageId="page-a" /> },
            { id: 'page-b', content: <WindowPage pageId="page-b" /> },
          ]}
          tableOfContents={[]}
        />
      )}
    </StoreProvider>
  );
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing window fixture root');
}

createRoot(root).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
