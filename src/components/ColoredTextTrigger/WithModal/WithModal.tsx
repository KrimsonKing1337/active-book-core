import {
  type KeyboardEvent,
  type PropsWithChildren,
  useId,
} from 'react';

import type { BookDialogMode } from '@active-book/types';

import { StoryDialog } from '@components/StoryDialog';
import { useReaderWindow, useStoryWindowDialog } from '@components/StoryWindowHost/hooks';

import { Action } from '@components/ColoredTextTrigger/Action';
import { AuthorComment } from '@components/ColoredTextTrigger/AuthorComment';
import { EasterEgg } from '@components/ColoredTextTrigger/EasterEgg';

import { activateOnKey } from '../utils';

import { DialogMedia } from './DialogMedia';

import styles from './WithModal.module.scss';

export type TriggerType = 'action' | 'author' | 'egg';

export type ModalWithVideoEasterEggProps = {
  mode?: BookDialogMode;
  text: string;
  triggerType: TriggerType;
  eggId?: string;
};

export const WithModal = ({
  children,
  mode = 'media',
  text,
  triggerType,
  eggId,
}: PropsWithChildren<ModalWithVideoEasterEggProps>) => {
  const contentId = useId();

  const { open, target } = useReaderWindow({ kind: 'dialog', contentId });
  const { dialogProps, isCurrentWindow } = useStoryWindowDialog(target);

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    activateOnKey(e, open);
  };

  const triggerProps = {
    role: 'button',
    tabIndex: 0,
    onClick: open,
    onKeyDown: handleKeyDown,
  };

  const getTrigger = () => {
    if (triggerType === 'author') {
      return (
        <AuthorComment {...triggerProps}>
          {text}
        </AuthorComment>
      );
    }

    if (triggerType === 'egg') {
      if (!eggId) {
        console.error(new Error('Id for EasterEgg must be passed!'));

        return null;
      }

      return (
        <EasterEgg {...triggerProps} id={eggId}>
          {text}
        </EasterEgg>
      );
    }

    return (
      <Action {...triggerProps}>
        {text}
      </Action>
    );
  };

  const trigger = getTrigger();
  const isMedia = mode === 'media';

  return (
    <span className={styles.Wrapper}>
      {trigger}

      <StoryDialog {...dialogProps} title={text} mode={mode}>
        <DialogMedia key={target?.instanceId} isMedia={isMedia} isCurrentWindow={isCurrentWindow}>
          {children}
        </DialogMedia>
      </StoryDialog>
    </span>
  );
};
