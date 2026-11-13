import { Fragment, useContext } from 'react';

import type { WindowTarget } from '@store/windows';

import { useSelector } from '@store';
import { windowsSelectors } from '@store/windows';

import { StoryDialog } from '@components/StoryDialog';

import type { StoryWindowHostProps } from './@types';

import { StoryWindowSessionContext } from './context';
import { useStoryWindowDialog } from './hooks';

export const StoryWindowHost = ({ resolveContent }: StoryWindowHostProps) => {
  const sessionId = useContext(StoryWindowSessionContext);
  const active = useSelector(windowsSelectors.activeWindow);
  let target: WindowTarget | undefined;

  if (sessionId && active?.kind === 'content') {
    target = { sessionId, instanceId: active.instanceId };
  }

  const { dialogProps } = useStoryWindowDialog(target);

  if (!dialogProps.isOpen || !active) {
    return null;
  }

  const { children, ...contentProps } = resolveContent(active.contentId);

  return (
    <StoryDialog {...contentProps} {...dialogProps}>
      <Fragment key={active.instanceId}>
        {children}
      </Fragment>
    </StoryDialog>
  );
};
