import type { CSSProperties } from 'react';

import { useRef } from 'react';

import type { VisualRendererProps } from '@active-book/types';

import { createPortal } from 'react-dom';
import classNames from 'classnames';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { useBookApplicationSurface } from '@components/BookApplicationSurface';
import { getFrameMaskImage } from '@components/FrameEffects/utils';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { numberParam, stringParam } from '../utils';

import * as styles from './AdvancingDarkness.module.scss';

const names = ['outside', 'frame', 'controls', 'narrative'] as const;
const milestones = ['outside-covered', 'frame-covered', 'controls-covered', 'narrative-covered'];

/** One author registration and run; four native phase animations in actual local/external hosts. */
export const AdvancingDarkness = (props: VisualRendererProps) => {
  const { elements, hosts } = useStoryRegions();
  const application = useBookApplicationSurface();
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const { token, status } = useAnimationPlayback(props, () => {
    const duration = numberParam(props.params, 'duration', 2000) / 4;
    const animations = names.map((nameCur, index) => {
      const node = nodesRef.current[index];

      if (!node) {
        throw new Error(`Darkness phase is not attached: ${nameCur}`);
      }

      return node.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration,
        delay: duration * index,
        fill: 'both',
        easing: 'ease-in',
      });
    });
    const phaseMilestones = animations.map((animationCur, index) => ({
      animation: animationCur,
      name: milestones[index],
    }));

    return {
      animations,
      milestones: phaseMilestones,
    };
  });
  const toolbar = elements.storyViewport?.querySelector<HTMLElement>('[data-story-toolbar]');
  const targets = [application?.hosts.underStory, hosts.narrativeFrame, toolbar, hosts.narrativeViewport];

  return names.map((nameCur, index) => {
    const target = targets[index];

    if (!target) {
      return null;
    }

    const phaseStyle: CSSProperties = {
      color: stringParam(props.params, 'color', '#03050b'),
      opacity: numberParam(props.params, 'opacity', 1),
      maskImage: index === 1 ? getFrameMaskImage(['top', 'right', 'bottom', 'left']) : undefined,
      maskComposite: index === 1 ? 'add' : undefined,
    };
    const inkClassNames = classNames(styles.Ink, {
      [styles.NarrativeInk]: index === 3,
    });

    return createPortal(
      <div
        className={styles.Phase}
        style={phaseStyle}
        data-demo-effect={index === 0 ? props.id : undefined}
        data-darkness-phase={nameCur}
        data-token={token}
        data-run-status={status}
      >
        <div
          ref={(node) => {
            nodesRef.current[index] = node;
          }}
          className={inkClassNames}
          data-phase-ink={nameCur}
        />
      </div>,
      target,
      nameCur,
    );
  });
};
