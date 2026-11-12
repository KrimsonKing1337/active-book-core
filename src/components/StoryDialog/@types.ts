import type { PropsWithChildren, RefObject } from 'react';

import type { BookDialogMode, BookDialogOptions } from '@active-book/types';

export type StoryDialogProps = PropsWithChildren & BookDialogOptions & {
  isOpen: boolean;
  title: string;
  description?: string;
  mode?: BookDialogMode;
  /** Positioned story viewport. Null never falls back to the browser body. */
  container: HTMLElement | null;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onOpenChange: (isOpen: boolean) => void;
};
