import {
  Fragment,
  useContext,
  useState,
} from 'react';

import type { BookDialogMode } from '@active-book/types';

import type { WindowTarget } from '@store/windows';

import { useSelector } from '@store';
import { windowsSelectors } from '@store/windows';

import { StoryDialog, getDialogMode } from '@components/StoryDialog';
import { DialogMedia } from '@components/DialogMedia';

import type { StoryWindowHostProps } from './@types';

import { StoryWindowSessionContext } from './context';
import { useStoryWindowDialog } from './hooks';

type Presentation = {
  instanceId: string;
  mode: BookDialogMode;
};

export const StoryWindowHost = ({ resolveContent }: StoryWindowHostProps) => {
  const sessionId = useContext(StoryWindowSessionContext);
  const [presentation, setPresentation] = useState<Presentation | null>(null);

  const active = useSelector(windowsSelectors.activeWindow);

  let target: WindowTarget | undefined;

  if (sessionId && active?.kind === 'content') {
    target = { sessionId, instanceId: active.instanceId };
  }

  const { dialogProps, isCurrentWindow } = useStoryWindowDialog(target);

  if (!dialogProps.isOpen || !active) {
    return null;
  }

  const content = resolveContent(active.contentId);
  let children = content.children;
  let mode = content.mode ?? 'default';

  if (content.nodes && content.render) {
    const { nodes } = content;
    const { instanceId } = active;
    mode = getDialogMode(nodes);

    if (presentation?.instanceId === instanceId) {
      mode = presentation.mode;
    }

    const handleSelect = (index: number) => {
      if (!isCurrentWindow()) {
        return;
      }

      const nextMode = getDialogMode(nodes, index);

      setPresentation((current) => {
        if (current?.instanceId === instanceId && current.mode === nextMode) {
          return current;
        }

        return { instanceId, mode: nextMode };
      });
    };

    children = (
      <DialogMedia isMedia={mode === 'media'} isCurrentWindow={isCurrentWindow}>
        {content.render(handleSelect)}
      </DialogMedia>
    );
  }

  return (
    <StoryDialog
      {...dialogProps}
      title={content.title}
      description={content.description}
      width={content.width}
      height={content.height}
      mode={mode}
    >
      <Fragment key={active.instanceId}>
        {children}
      </Fragment>
    </StoryDialog>
  );
};
