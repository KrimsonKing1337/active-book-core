import type { WindowTarget } from '@store/windows';

import {
  Article,
  Header,
  ModalDialog,
  P,
} from '@components';

export type ModalProps = {
  isActive: boolean;
  windowTarget?: WindowTarget;
  onConfirm: () => void;
  onCancel: () => void;
};

export const Modal = ({
  isActive,
  windowTarget,
  onConfirm,
  onCancel,
}: ModalProps) => {
  return (
    <ModalDialog
      isOpen={isActive}
      windowTarget={windowTarget}
      confirmButtonLabel="Хорошо"
      canFullScreen={false}
      showCancelButton={false}
      cantCloseIn={2000}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <div>
        <Header>
          Перед тем как начнём...
        </Header>

        <Article>
          <P>
            Познакомьтесь с возможностями книги
          </P>
        </Article>
      </div>
    </ModalDialog>
  );
};
