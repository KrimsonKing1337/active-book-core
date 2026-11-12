import { useSelector } from '@store';

import { mainSelectors } from '@store/main';

import { useReaderWindow } from '@components/StoryWindowHost/hooks';

import { Flags as ModalsFlags } from '@utils/localStorage/modalsWereShowed';
import { modalsWereShowed } from '@utils/localStorage/modalsWereShowed';

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
    modalOnClose,
    setModalIsActive: window.setIsOpen,
  };
};
