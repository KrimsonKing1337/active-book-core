import { useState } from 'react';

type ProbeProps = {
  id: string;
  background: string;
};

export const Probe = ({ id, background }: ProbeProps) => {
  const [token] = useState(() => crypto.randomUUID());

  const style = {
    width: '100%',
    height: '100%',
    background,
  };

  return <div data-probe={id} data-token={token} style={style} />;
};
