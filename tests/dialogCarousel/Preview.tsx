import { useState } from 'react';

import type { BookDialogMode } from '@active-book/types';

import { StoreProvider } from '../../src/store';

import { AppModeContext } from '../../src/components/App/AppModeContext';
import { BookApplicationSurface } from '../../src/components/BookApplicationSurface';
import { DialogMedia } from '../../src/components/DialogMedia';
import { StoryDialog, getDialogMode } from '../../src/components/StoryDialog';

import { galleryNodes, renderGallery } from './gallery';

const isCurrentWindow = () => true;

export const Preview = () => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [mode, setMode] = useState<BookDialogMode>(getDialogMode(galleryNodes));
  const handleSelect = (index: number) => setMode(getDialogMode(galleryNodes, index));

  return (
    <StoreProvider>
      <AppModeContext value="editor">
        <BookApplicationSurface
          style={{
            position: 'absolute',
            left: 60,
            top: 70,
            width: 540,
            height: 430,
          }}
        >
          <div
            ref={setContainer}
            data-testid="preview"
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
            }}
          >
            <button type="button" onClick={() => setOpen(true)}>
              Open preview
            </button>

            <StoryDialog
              isOpen={isOpen}
              container={container}
              title="Preview gallery"
              width={80}
              height={80}
              mode={mode}
              onOpenChange={setOpen}
            >
              <DialogMedia isMedia={mode === 'media'} isCurrentWindow={isCurrentWindow}>
                {renderGallery(handleSelect)}
              </DialogMedia>
            </StoryDialog>
          </div>
        </BookApplicationSurface>
      </AppModeContext>
    </StoreProvider>
  );
};
