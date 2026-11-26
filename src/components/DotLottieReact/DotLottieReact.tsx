import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  type DotLottie as DotLottieOriginal,
  type DotLottieReactProps as DotLottieReactPropsOriginal,
  DotLottieReact as DotLottieReactOriginal,
} from '@lottiefiles/dotlottie-react';

import type { EventType } from '@lottiefiles/dotlottie-web';

import { useCanStartPageEffects, usePagePresented } from '@hooks/pagePresentation/context';
import { type SettlePageResource, usePageResource } from '@hooks/pagePresentation/usePageResource';

export type DotLottie = DotLottieOriginal;

export type DotLottieReactProps = DotLottieReactPropsOriginal & {
  refCallback?: (dotLottieItem: DotLottie) => void;
  eventListeners?: {
    event: EventType;
    handler: () => void;
  }[];
};

const DotLottiePlayer = ({
  refCallback,
  dotLottieRefCallback,
  eventListeners,
  autoplay,
  stateMachineId,
  src,
  data,
  ...etc
}: DotLottieReactProps) => {
  const canStart = useCanStartPageEffects();
  const presented = usePagePresented();
  const [dotLottie, setDotLottie] = useState<DotLottie | null>(null);
  const [enabled, setEnabled] = useState(false);
  const failed = useRef(new WeakSet<DotLottie>());
  const started = useRef<DotLottie | null>(null);

  useLayoutEffect(() => {
    if (presented && canStart()) {
      setEnabled(true);
    }
  }, [presented, canStart]);

  const prepare = useCallback((settle: SettlePageResource) => {
    if (!dotLottie) {
      return;
    }

    if (dotLottie.isLoaded || failed.current.has(dotLottie)) {
      settle(failed.current.has(dotLottie) ? 'failed' : 'ready');

      return;
    }

    const ready = () => settle();
    const error = () => settle('failed');

    dotLottie.addEventListener('load', ready);
    dotLottie.addEventListener('loadError', error);

    return () => {
      dotLottie.removeEventListener('load', ready);
      dotLottie.removeEventListener('loadError', error);
    };
  }, [dotLottie]);

  usePageResource(src || data ? prepare : null);

  useEffect(() => {
    if (!dotLottie || !eventListeners) {
      return;
    }

    for (const { event, handler } of eventListeners) {
      dotLottie.addEventListener(event, handler);
    }

    return () => {
      for (const { event, handler } of eventListeners) {
        dotLottie.removeEventListener(event, handler);
      }
    };
  }, [dotLottie, eventListeners]);

  useEffect(() => {
    if (!presented || !autoplay || !dotLottie || started.current === dotLottie) {
      return;
    }

    const start = () => {
      if (!canStart()) {
        return;
      }

      started.current = dotLottie;
      dotLottie.play();
    };

    if (dotLottie.isLoaded) {
      start();

      return;
    }

    dotLottie.addEventListener('load', start);

    return () => {
      dotLottie.removeEventListener('load', start);
    };
  }, [
    canStart,
    presented,
    autoplay,
    dotLottie,
  ]);

  const attach = (instance: DotLottie | null) => {
    setDotLottie(instance);
    const cleanup = dotLottieRefCallback?.(instance);

    if (instance) {
      instance.addEventListener('loadError', () => {
        failed.current.add(instance);
      });

      refCallback?.(instance);
    }

    return cleanup;
  };

  return (
    <DotLottieReactOriginal
      {...etc}
      autoplay={false}
      stateMachineId={enabled ? stateMachineId : undefined}
      src={src}
      data={data}
      dotLottieRefCallback={attach}
    />
  );
};


export const DotLottieReact = (props: DotLottieReactProps) => {
  const { src, data } = props;
  const [source, setSource] = useState({
    src,
    data,
    revision: 0,
  });

  if (src !== source.src || data !== source.data) {
    // The vendor's load events carry no source. Replacing the player isolates old loads.
    setSource({
      src,
      data,
      revision: source.revision + 1,
    });
  }

  return <DotLottiePlayer key={source.revision} {...props} />;
};
