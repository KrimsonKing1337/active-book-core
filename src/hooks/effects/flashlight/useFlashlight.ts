import { useSelector } from 'store';
import { configSelectors } from 'store/config';

import { useSideShadow } from 'hooks/effects/side/useSideShadow';

import { flashlightInst } from 'utils/effects/flashlight';
import { sleep } from 'utils/sleep';

export const useFlashlight = (withSideShadow = false, speed = 150) => {
  const theme = useSelector(configSelectors.theme);

  const darkTheme = theme === 'dark';
  const color = darkTheme ? '#fff' : '#9addf4';

  const { sideShadowOn, sideShadowOff } = useSideShadow({
    color,
    isActiveDefault: false,
    speed,
  });

  const off = () => {
    console.log('___ flashlight off');

    if (withSideShadow) {
      sideShadowOff();
    }

    flashlightInst.off();
  };

  const on = async (duration?: number) => {
    if (document.hidden) {
      return;
    }

    console.log('___ flashlight on');

    if (withSideShadow) {
      sideShadowOn();
    }

    flashlightInst.on();

    if (duration) {
      await sleep(duration);

      off();

      if (withSideShadow) {
        sideShadowOff();
      }
    }
  };

  return {
    flashlightOff: off,
    flashlightOn: on,
  };
};
