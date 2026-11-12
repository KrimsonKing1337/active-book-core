import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import { useReaderWindow } from '@components/StoryWindowHost/hooks';

import { Overflow } from '@components/Overflow';
import { MenuHeader } from '@components/MenuHeader';

import {
  Volume,
  Themes,
  Vibration,
  Flashlight,
  AuthorComments,
  LineHeight,
  Footer,
  WelcomeTour,
} from './components';

export const Menu = () => {

  const { isOpen, close } = useReaderWindow({ kind: 'menu' });
  const allPagesSeen = useSelector(mainSelectors.allPagesSeen);

  return (
    <Overflow isOpen={isOpen} onClose={close}>
      <MenuHeader label="Настройки" />
      <Volume />
      <Themes />
      <WelcomeTour />
      <Vibration />
      <Flashlight />

      {allPagesSeen && (
        <AuthorComments />
      )}

      <LineHeight />
      <Footer />
    </Overflow>
  );
};
