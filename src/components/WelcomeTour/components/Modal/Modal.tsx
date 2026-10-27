import { Article, Header, ModalDialog, P } from '@components';

export type ModalProps = {
  isActive: boolean;
  onConfirm: () => void;
};

export const Modal = ({ isActive, onConfirm }: ModalProps) => {
  return (
    <ModalDialog
      isOpen={isActive}
      confirmButtonLabel="Хорошо"
      canFullScreen={false}
      showCancelButton={false}
      cantCloseIn={2000}
      onConfirm={onConfirm}
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
