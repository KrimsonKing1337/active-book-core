import { useRef } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import type { LayoutLease } from '@controllers/visualEffects';

import { useBookApplicationSurface } from '@components/BookApplicationSurface';

import { useTimeline } from '../hooks/useTimeline';

export const Collapse = (props: VisualRendererProps) => {
  const application = useBookApplicationSurface();
  const leaseRef = useRef<LayoutLease | null>(null);
  const mode = props.params.physicalMode === 'size' ? 'size' : 'scale';
  const { progress, token } = useTimeline(props, {
    frame: (next) => {
      if (next === 0) {
        return;
      }

      leaseRef.current ??= application?.layout.acquire(mode) ?? null;
      let factor = 0;

      if (next < 0.4) {
        factor = 1 - next / 0.4;
      } else if (next > 0.6) {
        factor = (next - 0.6) / 0.4;
      }
      leaseRef.current?.update(factor);
    },
    finish: () => {
      leaseRef.current?.release();
      leaseRef.current = null;
    },
  });

  return <output
    data-demo-effect={props.id}
    data-token={token}
    data-progress={progress.toFixed(3)}
    hidden
  />;
};
