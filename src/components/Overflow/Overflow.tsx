import type { HTMLAttributes, PropsWithChildren } from 'react';

import {
  useContext,
  useEffect,
  useRef,
} from 'react';

import classNames from 'classnames';

import { useStore } from '@store';

import { useAppMode } from '@components/App/AppModeContext';
import { StoryWindowSessionContext } from '@components/StoryWindowHost/context';
import { getNarrativeElement } from '@components/StoryShell/components/Narrative/utils';

import * as styles from './Overflow.module.scss';

export type OverflowProps = HTMLAttributes<HTMLDivElement> & PropsWithChildren & {
  isOpen: boolean;
  onClose: () => void;
};

export const Overflow = ({
  children,
  isOpen,
  className = '',
  onClose,
  ...etc
}: OverflowProps) => {
  const appMode = useAppMode();
  const store = useStore();
  const sessionId = useContext(StoryWindowSessionContext);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || appMode !== 'reader') {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => document.removeEventListener('keydown', handleEscape);
  }, [appMode, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || appMode !== 'reader') {
      return;
    }

    const opener = document.activeElement;
    overflowRef.current?.focus();

    return () => {
      const { windows } = store.getState();

      if (windows.sessionId !== sessionId || windows.activeWindow) {
        return;
      }

      if (opener instanceof HTMLElement && opener.isConnected &&
          !opener.closest('[inert], [data-book-window-open="false"]')) {
        opener.focus();
      } else {
        getNarrativeElement()?.focus();
      }
    };
  }, [appMode, isOpen, sessionId, store]);

  const overflowClassNames = classNames({
    [styles.Overflow]: true,
    [styles.isOpen]: isOpen,
    [className]: !!className,
  });

  return (
    <div
      ref={overflowRef}
      className={overflowClassNames}
      tabIndex={0}
      data-book-window-open={isOpen}
      {...etc}
    >
      {children}
    </div>
  );
};
