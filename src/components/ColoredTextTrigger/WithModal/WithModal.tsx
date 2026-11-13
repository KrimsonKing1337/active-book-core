import type { PropsWithChildren } from 'react';

import {
  useEffect,
  useRef,
  useId,
} from 'react';

import type { ModalProps } from '@components/Modal';
import { Modal as ModalComponent } from '@components/Modal';
import { useReaderWindow } from '@components/StoryWindowHost/hooks';

import { Action } from '@components/ColoredTextTrigger/Action';
import { AuthorComment } from '@components/ColoredTextTrigger/AuthorComment';
import { EasterEgg } from '@components/ColoredTextTrigger/EasterEgg';

import * as styles from './WithModal.module.scss';

export type TriggerType = 'action' | 'author' | 'egg';

export type ModalWithVideoEasterEggProps = {
  mode?: ModalProps['mode'];
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

  const {
    isOpen: isActive,
    open,
    close,
    target,
  } = useReaderWindow({ kind: 'legacy', contentId });

  const wrapperRef = useRef<HTMLDivElement>(null);

  const getTrigger = () => {
    if (triggerType === 'author') {
      return (
        <AuthorComment onClick={open}>
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
        <EasterEgg onClick={open} id={eggId}>
          {text}
        </EasterEgg>
      );
    }

    return (
      <Action onClick={open}>
        {text}
      </Action>
    );
  };

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const video = wrapperRef.current.querySelector('video');

    if (!video) {
      return;
    }

    if (isActive) {
      video.play();
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  const trigger = getTrigger();

  return (
    <span className={styles.Wrapper} ref={wrapperRef}>
      <ModalComponent
        isOpen={isActive}
        windowTarget={target}
        mode={mode}
        canCrop
        cropDefault={false}
        canFullScreen
        onClose={close}
      >
        {children}
      </ModalComponent>

      {trigger}
    </span>
  );
};
