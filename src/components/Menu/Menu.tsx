import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

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

  const menuActiveState = useSelector(mainSelectors.menuActiveState);
  const allPagesSeen = useSelector(mainSelectors.allPagesSeen);

  const isOpen = menuActiveState === 'menu';

  return (
    <Overflow isOpen={isOpen}>
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
