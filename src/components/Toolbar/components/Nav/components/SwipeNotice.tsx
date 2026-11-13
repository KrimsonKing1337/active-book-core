import type { WindowTarget } from '@store/windows';

import { StoryConfirmDialog } from '@components/StoryConfirmDialog';

export type SwipeNoticeProps = {
  target?: WindowTarget;
  onConfirm: () => void;
  onCancel: () => void;
};

export const SwipeNotice = ({
  target,
  onConfirm,
  onCancel,
}: SwipeNoticeProps) => (
  <StoryConfirmDialog
    target={target}
    title="Вы можете использовать свайпы"
    description="А так же стрелки клавиатуры и клавиши A, D"
    confirmationDelayMs={2000}
    showCancelButton={false}
    confirmLabel="Хорошо"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
