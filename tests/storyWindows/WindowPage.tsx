import { useEffect } from 'react';

import { store } from '../../src/store';
import type { StoryWindowContent } from '../../src/components/StoryWindowHost';

import { StoryWindowHost, useStoryWindowActions } from '../../src/components/StoryWindowHost';

import { api } from './api';

export const WindowPage = ({ pageId }: { pageId: string }) => {
  const {
    open,
    requestClose,
    forceClose,
  } = useStoryWindowActions();

  useEffect(() => {
    api.open = (contentId, canClose = true) => open({ contentId, canClose });
    api.requestClose = requestClose;
    api.forceClose = forceClose;
    api.captureCallbacks = () => {
      const active = store.getState().windows.activeWindow;

      if (!active) {
        throw new Error('Capture requires an active window');
      }

      api.lateClose = () => requestClose(active.instanceId);
      api.lateForceClose = () => forceClose(active.instanceId);
      api.lateOpen = () => open({ contentId: 'stale-page' });
    };
  }, [open, requestClose, forceClose]);

  const resolveContent = (contentId: string): StoryWindowContent => {
    return {
      title: `Окно ${contentId}`,
      description: 'Тест композиции Redux и Radix',
      children: (
        <>
          <input aria-label="Содержимое окна" defaultValue={contentId} />

          <button type="button" onClick={() => requestClose(store.getState().windows.activeWindow?.instanceId ?? '')}>
            Закрыть окно
          </button>

          <button type="button" onClick={() => open({ contentId: 'B' })}>
            Заменить на B
          </button>
        </>
      ),
    };
  };

  return (
    <div data-testid={pageId}>
      <button type="button" data-testid="open-a" onClick={() => open({ contentId: 'A' })}>
        Открыть A
      </button>

      <StoryWindowHost resolveContent={resolveContent} />
    </div>
  );
};
