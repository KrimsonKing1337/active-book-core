import { useLayoutEffect } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import { getMetrics } from '../metrics';

export const StaticRenderer = ({ id, params }: VisualRendererProps) => {
  useLayoutEffect(() => {
    const metric = getMetrics(id);
    metric.mounts += 1;

    return () => { metric.unmounts += 1; };
  }, [id]);

  return (
    <div data-static={id}>
      {String(params.label)}
    </div>
  );
};
