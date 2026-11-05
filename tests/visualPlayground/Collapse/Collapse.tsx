import type { VisualRendererProps } from '@active-book/types';

import { useStoryRegions } from '@components/StoryRegionsProvider';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { numberParam } from '../utils';

/** Visual transform only. Cancelling the native animation exposes the original inline CSS. */
export const Collapse = (props: VisualRendererProps) => {
  const { elements } = useStoryRegions();
  const { token, status } = useAnimationPlayback(props, () => {
    const viewport = elements.storyViewport;

    if (!viewport) {
      throw new Error('StoryViewport is not attached');
    }

    const base = viewport.style.transform;
    const animation = viewport.animate([
      { transform: `${base} scale(1)` },
      { transform: `${base} scale(0)`, offset: 0.4 },
      { transform: `${base} scale(0)`, offset: 0.6 },
      { transform: `${base} scale(1)` },
    ], {
      duration: numberParam(props.params, 'duration', 2000),
      fill: 'none',
    });

    return { animations: [animation] };
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
