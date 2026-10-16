import { useCallback, useEffect } from 'react';

import { useSelector } from 'store';
import { mainSelectors } from 'store/main';
import { off as vibrationOff, on as vibrationOn } from 'utils/effects/vibration';

export function useVibration() {
  const isVibrationAvailable = useSelector(mainSelectors.isVibrationAvailable);

  const on = useCallback((n: number) => {
    if (!isVibrationAvailable) {
      return;
    }

    if (document.hidden) {
      return;
    }

    vibrationOn(n);

    console.log(`___ vibrated: ${n}`);
  }, [isVibrationAvailable]);

  const off = useCallback(() => {
    if (!isVibrationAvailable) {
      return;
    }

    vibrationOff();
  }, [isVibrationAvailable]);

  useEffect(() => {
    return () => {
      off();
    };
  }, [off]);

  return { vibrationOff: off, vibrationOn: on };
}
