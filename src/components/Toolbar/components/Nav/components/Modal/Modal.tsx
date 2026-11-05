import { ModalDialog, Article, Header, P } from '@components';

export type ModalProps = {
  isActive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onOpen: () => void;
};

export const Modal = ({
  isActive,
  onConfirm,
  onCancel,
  onOpen,
}: ModalProps) => {
  return (
    <ModalDialog
      isOpen={isActive}
      confirmButtonLabel="Хорошо"
      canFullScreen={false}
      showCancelButton={false}
      cantCloseIn={2000}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onOpen={onOpen}
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
