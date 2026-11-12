import type { CSSProperties } from 'react';

import {
  StrictMode,
  useEffect,
  useState,
} from 'react';

import { createRoot } from 'react-dom/client';

import type { BookDialogMode, BookDialogOptions } from '@active-book/types';

import { AppModeContext } from '../../src/components/App/AppModeContext';
import { BookApplicationSurface } from '../../src/components/BookApplicationSurface';
import { StoryDialog } from '../../src/components/StoryDialog';

declare global {
  interface Window {
    dialogFixture: {
      setMode: (mode: BookDialogMode) => void;
      setCanClose: (canClose: boolean) => void;
      setOpen: (isOpen: boolean) => void;
      setMounted: (isMounted: boolean) => void;
      setContainer: (container: HTMLDivElement | null) => void;
      setSize: (size: { width: number; height: number }) => void;
    };
  }
}

const imageSource = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600">'
  + '<rect width="1200" height="600" fill="teal"/></svg>',
);

const Fixture = () => {
  const params = new URLSearchParams(location.search);
  const isEditor = params.get('mode') === 'editor';
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [isMounted, setMounted] = useState(true);
  const [canClose, setCanClose] = useState(true);
  const [mode, setMode] = useState<BookDialogMode>('media');
  const [size, setSize] = useState({ width: 640, height: 400 });

  useEffect(() => {
    window.dialogFixture = {
      setMode,
      setCanClose,
      setOpen,
      setMounted,
      setContainer,
      setSize,
    };
  }, []);

  const dimensions: BookDialogOptions = {};

  if (params.get('defaults') !== 'true') {
    dimensions.width = 60;
    dimensions.height = 70;
  }

  let appMode: 'reader' | 'editor' = 'reader';
  const surfaceStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
  };

  if (isEditor) {
    appMode = 'editor';
    surfaceStyle.position = 'absolute';
    surfaceStyle.inset = '100px auto auto 80px';
    surfaceStyle.width = size.width;
    surfaceStyle.height = size.height;
  }

  let content = <img src={imageSource} alt="Пейзаж" />;

  if (mode === 'default') {
    content = (
      <div style={{ height: 1600 }}>
        <input aria-label="Поле в окне" />

        <p>
          Длинное содержимое не изменяет авторские размеры окна
        </p>
      </div>
    );
  }

  return (
    <AppModeContext value={appMode}>
      <BookApplicationSurface style={surfaceStyle}>
        <div
          ref={setContainer}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
          data-testid="viewport"
          data-dialog-mounted={isMounted}
          data-dialog-open={isOpen}
          data-dialog-container={Boolean(container)}
        >
          <button type="button" data-testid="open" onClick={() => setOpen(true)}>
            Открыть окно
          </button>

          <div
            style={{
              position: 'absolute',
              inset: '100px 0 0',
              zIndex: 6,
              pointerEvents: 'none',
            }}
          >
            Визуальный эффект поверх истории
          </div>

          {isMounted && (
            <StoryDialog
              isOpen={isOpen}
              container={container}
              title="Окно истории"
              description="Проверка универсального содержимого"
              mode={mode}
              {...dimensions}
              canClose={canClose}
              onOpenChange={setOpen}
            >
              {content}
            </StoryDialog>
          )}
        </div>
      </BookApplicationSurface>
    </AppModeContext>
  );
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing dialog fixture root');
}

createRoot(root).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
