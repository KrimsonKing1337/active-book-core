import type { WindowTarget } from '@store/windows';

import {
  ModalDialog,
  Article,
  Header,
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
          Вы можете использовать свайпы
        </Header>

        <Article>
          <P>
            А так же стрелки клавиатуры и клавиши A, D
          </P>
        </Article>
      </div>
    </ModalDialog>
  );
};
