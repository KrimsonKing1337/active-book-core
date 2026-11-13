import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import { useReaderWindow } from '@components/StoryWindowHost/hooks';

import { Flags as ModalsFlags, modalsWereShowed } from '@utils/localStorage/modalsWereShowed';

export const useCameraNotice = () => {
  const id = useSelector(mainSelectors.id);

  const window = useReaderWindow({
    kind: 'dialog',
    contentId: 'camera-notice',
    canClose: false,
  });

  const confirm = () => {
    window.forceClose();

    modalsWereShowed.set(id, ModalsFlags.usingCamera, true);
  };

  return {
    target: window.target,
    open: window.open,
    confirm,
  };
};
