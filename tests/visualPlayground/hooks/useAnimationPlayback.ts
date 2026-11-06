import { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

import type { VisualRendererProps } from '@active-book/types';


import { useVisualEffects } from '@controllers/visualEffects';

import { numberParam } from '../utils';

type Milestone = {
  animation: Animation;
  name: string;
};

export type DemoAnimations = {
  animations: Animation[];
  milestones?: Milestone[];
  cleanup?: () => void;
};

type Activation = {
  animations: Animation[];
  cleanup?: () => void;
  reporter: ReturnType<ReturnType<typeof useVisualEffects>['runs']['start']>;
};

const clock = (duration: number) => {
  const animation = new Animation(new KeyframeEffect(null, [], { duration }), document.timeline);
  animation.play();

  return animation;
};

/** Lab playback adapter: native clocks and phase events, never a React update per frame. */
export const useAnimationPlayback = (props: VisualRendererProps, build: () => DemoAnimations) => {
  const session = useVisualEffects();
  const [token] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const activationRef = useRef<Activation | null>(null);
  const currentRef = useRef({ props, build });

  useLayoutEffect(() => {
    currentRef.current = { props, build };
  });

  const cancel = useCallback(() => {
    const activation = activationRef.current;
    activationRef.current = null;
    activation?.reporter.cancel();
    activation?.animations.forEach((cur) => cur.cancel());
    activation?.cleanup?.();
  }, []);

  const stop = useCallback(() => {
    cancel();
    setStatus('idle');
  }, [cancel]);

  useImperativeHandle(props.ref, () => ({
    play: () => {
      const previous = activationRef.current;

      if (previous?.animations.some((cur) => cur.playState === 'paused')) {
        previous.animations.forEach((animationCur) => {
          if (animationCur.playState === 'paused') {
            animationCur.play();
          }
        });
        previous.reporter.resume();
        setStatus('running');

        return;
      }

      cancel();
      const { props: currentProps, build: buildAnimations } = currentRef.current;
      const duration = Math.max(100, numberParam(currentProps.params, 'duration', 2000));
      const reporter = session.runs.start(props.id);
      let bundle: DemoAnimations;

      try {
        bundle = buildAnimations();
      } catch (error) {
        reporter.cancel();
        throw error;
      }

      const animations = bundle.animations.length ? bundle.animations : [clock(duration)];
      const boundary = clock(duration * 0.55);
      const activation = {
        animations: [...animations, boundary],
        reporter,
        cleanup: bundle.cleanup,
      };
      activationRef.current = activation;
      setStatus('running');
      const milestones = [...(bundle.milestones ?? []), { animation: boundary, name: 'boundary-reached' }];

      milestones.forEach(({ animation, name }) => {
        void animation.finished.then(() => {
          if (activationRef.current === activation) {
            reporter.milestone(name);
          }
        }).catch(() => {});
      });

      void Promise.all(activation.animations.map((cur) => cur.finished)).then(() => {
        if (activationRef.current === activation) {
          reporter.complete();
          setStatus('completed');
        }
      }).catch(() => {});
    },
    pause: () => {
      const activation = activationRef.current;

      if (activation?.animations.some((cur) => cur.playState === 'running')) {
        activation.animations.forEach((animationCur) => {
          if (animationCur.playState === 'running') {
            animationCur.pause();
          }
        });
        activation.reporter.pause();
        setStatus('paused');
      }
    },
    stop,
  }), [props.id, session, cancel, stop]);

  useLayoutEffect(() => cancel, [cancel]);

  return {
    token,
    status,
    active: status !== 'idle',
    playing: status === 'running',
  };
};
