import type { VisualRendererProps } from '@active-book/types';

import { useStoryRegions } from '@components/StoryRegionsProvider';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { numberParam } from '../utils';
import { startCssAnimation } from '../hooks/startCssAnimation';

import * as styles from './Collapse.module.scss';

/** Visual transform only. Cancelling the native animation exposes the original inline CSS. */
export const Collapse = (props: VisualRendererProps) => {
  const { elements } = useStoryRegions();
  const { token, status } = useAnimationPlayback(props, () => {
    const viewport = elements.storyViewport;

    if (!viewport) {
      throw new Error('StoryViewport is not attached');
    }

    const effect = startCssAnimation({
      node: viewport,
      className: styles.Collapse,
      duration: numberParam(props.params, 'duration', 2000),
    });

    return { animations: [effect.animation], cleanup: effect.cleanup };
  });

  return (
    <output
      data-demo-effect={props.id}
      data-token={token}
      data-run-status={status}
      hidden
    />
  );
};
