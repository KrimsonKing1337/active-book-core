import type { WindowTarget } from '@store/windows';

import { StoryConfirmDialog } from '@components';

export type WelcomeNoticeProps = {
  target?: WindowTarget;
  onConfirm: () => void;
  onCancel: () => void;
};

export const WelcomeNotice = ({
  target,
  onConfirm,
  onCancel,
}: WelcomeNoticeProps) => (
  <StoryConfirmDialog
    target={target}
    title="Перед тем как начнём..."
    description="Познакомьтесь с возможностями книги"
    confirmationDelayMs={2000}
    showCancelButton={false}
    confirmLabel="Хорошо"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
