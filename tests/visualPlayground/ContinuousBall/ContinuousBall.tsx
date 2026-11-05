import { useLayoutEffect, useRef, useState } from 'react';

import type { VisualRendererProps } from '@active-book/types';

import { createPortal } from 'react-dom';

import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import { useNarrativeFrame } from '@components/PageWrapper/NarrativeFrameContext';

import * as styles from './ContinuousBall.module.scss';

let mountCount = 0;
const committedNodes = new WeakMap<Element, number>();

/** No saved phase: this animation belongs to this DOM node for its entire activation. */
export const ContinuousBall = ({ id }: VisualRendererProps) => {
  const target = useNarrativeFrame();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [token] = useState(() => crypto.randomUUID());
  const [mount, setMount] = useState(0);
  const page = useSelector(mainSelectors.page);
  const isPageOnly = id === 'page-ball';

  useLayoutEffect(() => {
    const node = nodeRef.current;

    if (!node || !target) {
      return;
    }

    let count = committedNodes.get(node);

    if (!count) {
      mountCount += 1;
      count = mountCount;
      committedNodes.set(node, count);
    }

    setMount(count);

    const animation = node.animate([
      {
        left: '10%', top: '15%', transform: 'scale(1)',
      },
      {
        left: '78%', top: '30%', transform: 'scale(1.2)',
      },
      {
        left: '65%', top: '80%', transform: 'scale(0.9)',
      },
      {
        left: '20%', top: '65%', transform: 'scale(1.1)',
      },
      {
        left: '10%', top: '15%', transform: 'scale(1)',
      },
    ], {
      duration: 20000,
      iterations: Infinity,
      easing: 'ease-in-out',
      direction: isPageOnly ? 'alternate-reverse' : 'alternate',
    });

    return () => {
      animation.cancel();
    };
  }, [target, isPageOnly]);

  if (!target) {
    return null;
  }

  return createPortal(
    <div className={styles.Host} data-local-effect-host={id}>
      <div
        ref={nodeRef}
        className={styles.Ball}
        data-ball={id}
        data-token={token}
        data-page-only={isPageOnly}
      />
      <output className={styles.Diagnostics} data-ball-diagnostics={id} data-mount={mount}>
        {isPageOnly ? 'Page 1' : 'Range 1–2, 4'} · {token} · mount {mount} · page {page} · running
      </output>
    </div>,
    target,
  );
};
