import { useLayoutEffect, useRef } from 'react';

import * as styles from './CanvasEffect.module.scss';

export const CanvasEffect = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const context = ref.current!.getContext('2d')!;
    context.fillStyle = '#55ddaa';
    context.fillRect(0, 0, 64, 64);
  }, []);

  return (
    <div className={styles.Probe} data-css-range>
      <canvas ref={ref} width={64} height={64} />
    </div>
  );
};
