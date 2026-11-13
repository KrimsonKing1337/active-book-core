import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import { useReaderWindow } from '@components/StoryWindowHost/hooks';

import { Flags as ModalsFlags, modalsWereShowed } from '@utils/localStorage/modalsWereShowed';

export const useModal = () => {
  const id = useSelector(mainSelectors.id);

  const window = useReaderWindow({
    kind: 'legacy',
    contentId: 'camera-notice',
    canClose: false,
  });

  const modalOnClose = () => {
    window.forceClose();

    modalsWereShowed.set(id, ModalsFlags.usingCamera, true);
  };

  return {
    modalIsActive: window.isOpen,
    windowTarget: window.target,
    setModalIsActive: window.setIsOpen,
    modalOnClose,
  };
};
