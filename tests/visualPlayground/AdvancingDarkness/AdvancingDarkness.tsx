import type { CSSProperties } from 'react';

import { useRef } from 'react';

import type { VisualRendererProps } from '@active-book/types';

import { createPortal } from 'react-dom';

import { useStoryRegions } from '@components/StoryRegionsProvider';
import { useBookApplicationSurface } from '@components/BookApplicationSurface';
import { getFrameMaskImage } from '@components/FrameEffects/utils';

import { startCssAnimation } from '../hooks/startCssAnimation';

import { useAnimationPlayback } from '../hooks/useAnimationPlayback';
import { numberParam, stringParam } from '../utils';

import * as styles from './AdvancingDarkness.module.scss';

const names = ['outside', 'frame', 'controls', 'narrative'] as const;
const milestones = ['outside-covered', 'frame-covered', 'controls-covered', 'narrative-covered'];

/** One author registration and run; four native phase animations in actual local/external hosts. */
export const AdvancingDarkness = (props: VisualRendererProps) => {
  const { hosts } = useStoryRegions();
  const application = useBookApplicationSurface();
  const nodesRef = useRef<(HTMLDivElement | null)[]>([]);
  const { token, status } = useAnimationPlayback(props, () => {
    const activePhases = names.flatMap((nameCur, index) => {
      const node = nodesRef.current[index];
      if (!node) {
        if (nameCur === 'controls') {
          return [];
        }
        throw new Error(`Darkness phase is not attached: ${nameCur}`);
      }

      return [{
        node, name: nameCur, milestone: milestones[index],
      }];
    });
    const duration = numberParam(props.params, 'duration', 2000) / activePhases.length;
    const effects = activePhases.map((phaseCur, index) => startCssAnimation({
      node: phaseCur.node, className: styles.Fade, duration, delay: duration * index,
    }));
    const animations = effects.map((cur) => cur.animation);
    const phaseMilestones = activePhases.map((phaseCur, index) => ({
      animation: animations[index], name: phaseCur.milestone,
    }));
    if (!activePhases.some((cur) => cur.name === 'controls')) {
      const frame = activePhases.findIndex((cur) => cur.name === 'frame');
      phaseMilestones.push({ animation: animations[frame], name: 'controls-covered' });
    }

    return {
      animations,
      cleanup: () => effects.forEach((cur) => cur.cleanup()),
      milestones: phaseMilestones,
    };
  });
  const split = stringParam(props.params, 'composition', 'single') === 'multiple';
  const targets = [application?.hosts.underStory, split ? hosts.narrativeFrame : hosts.storyViewportFrame,
    hosts.toolbarFrame, hosts.narrativeViewport];

  const renderedPhases = names.map((nameCur, index) => {
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
          className={styles.Ink}
          data-phase-ink={nameCur}
        />
      </div>,
      target,
      nameCur,
    );
  });

  // The final application veil also covers the viewport's outline and shadow.
  // Region phases stay native; this is a single semantic completion update.
  const finalHost = application?.hosts.aboveStory;
  const finalStyle: CSSProperties = {
    background: stringParam(props.params, 'color', '#03050b'),
    opacity: numberParam(props.params, 'opacity', 1),
  };

  return (
    <>
      {renderedPhases}

      {status === 'completed' && finalHost && createPortal(
        <div className={styles.FinalVeil} style={finalStyle} data-darkness-final />,
        finalHost,
      )}
    </>
  );
};
