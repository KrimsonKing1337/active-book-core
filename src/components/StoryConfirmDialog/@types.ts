import type { WindowTarget } from '@store/windows';

import type { StoryDialogProps } from '@components/StoryDialog';

type ConfirmPresentation = Pick<
  StoryDialogProps,
  | 'children'
  | 'title'
  | 'description'
  | 'width'
  | 'height'
>;

export type StoryConfirmDialogProps = ConfirmPresentation & {
  target?: WindowTarget;
  confirmationDelayMs?: number;
  allowDismiss?: boolean;
  showCancelButton?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;

  onConfirm: () => void;
  onCancel?: () => void;
};
