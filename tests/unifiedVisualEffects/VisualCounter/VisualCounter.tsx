import { useEffect, useRef, useState } from 'react';

let generation = 0;

export const metrics = {
  mounts: 0,
  destroys: 0,
};

export const VisualCounter = ({ label }: { label: string }) => {
  const [value, setValue] = useState(0);
  const token = useRef(++generation);
  useEffect(() => {
    metrics.mounts += 1;

    return () => {
      metrics.destroys += 1;
    };
  }, []);
  useEffect(() => {
    const increment = () => setValue((previous) => previous + 1);
    window.addEventListener('increment-visual', increment);

    return () => window.removeEventListener('increment-visual', increment);
  }, []);

  return (
    <div
      data-testid={label}
      data-instance={token.current}
      style={{
        position: 'absolute',
        inset: 0,
      }}
    >
      {value}
    </div>
  );
};
