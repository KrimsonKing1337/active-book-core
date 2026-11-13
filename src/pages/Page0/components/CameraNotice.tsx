import type { WindowTarget } from '@store/windows';

import { StoryConfirmDialog } from '@components/StoryConfirmDialog';

export type CameraNoticeProps = {
  target?: WindowTarget;
  onConfirm: () => void;
};

const description = 'Для работы эффектов на основе вспышки, приложению необходимо получить разрешение к камере '
  + '(к сожалению, нет возможности запросить разрешение только ко вспышке).'
  + '\n\nВы всегда можете запросить разрешение ещё раз, в меню приложения';

export const CameraNotice = ({ target, onConfirm }: CameraNoticeProps) => (
  <StoryConfirmDialog
    target={target}
    title="ОБРАТИТЕ ВНИМАНИЕ"
    description={description}
    confirmationDelayMs={5000}
    allowDismiss={false}
    showCancelButton={false}
    confirmLabel="Хорошо"
    onConfirm={onConfirm}
  />
);
