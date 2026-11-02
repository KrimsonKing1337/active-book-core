import type { RefObject } from 'react';

import { useEffect, useRef } from 'react';

import { useDispatch, useSelector } from '@store';

import { volumeSelectors } from '@store/volume';
import { effectsActions, effectsSelectors } from '@store/effects/common';

type VideoProps = React.MediaHTMLAttributes<HTMLVideoElement> & {
  id: string;
  className?: string;
  src: string;
  relativeVolume?: number;
  preserveTime?: boolean;
  elementRef?: RefObject<HTMLVideoElement | null>;

  onCanPlay?: () => void;
  onError?: () => void;
};

export const Video = ({
  id,
  className = '',
  src,
  relativeVolume = 100,
  muted = true,
  autoPlay = true,
  preserveTime = true,
  elementRef,

  onCanPlay,
  onError,
  ...etc
}: VideoProps) => {
  const dispatch = useDispatch();

  const ownRef = useRef<HTMLVideoElement>(null);
  const refCurrentTime = useRef(0);

  const ref = elementRef ?? ownRef;

  const { videos: videosVolume, global: globalVolume } = useSelector(volumeSelectors.all);
  const videosCurrentTime = useSelector(effectsSelectors.videosCurrentTime);

  useEffect(() => {
    const element = ref.current;

    return () => {
      if (preserveTime || !element) {
        return;
      }
      // StrictMode replays effects while the same DOM node is still connected.
      queueMicrotask(() => {
        if (!element.isConnected) {
          element.pause();
          element.removeAttribute('src');
          element.load();
        }
      });
    };
  }, [preserveTime, ref]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.volume = (videosVolume / 100) * (relativeVolume / 100) * (globalVolume / 100);
    ref.current.setAttribute('data-relativeVolume', relativeVolume.toString());

    if (preserveTime && videosCurrentTime[id]) {
      ref.current.currentTime = videosCurrentTime[id];
    }

    ref.current.addEventListener('timeupdate', () => {
      refCurrentTime.current = ref.current?.currentTime || 0;
    });

    return () => {
      if (!preserveTime || !refCurrentTime.current) {
        return;
      }

      dispatch(effectsActions.setVideoCurrentTime({
        id,
        currentTime: refCurrentTime.current,
      }));
    };
  }, []);

  return (
    <video
      ref={ref}
      data-id={id}
      data-autoplay={autoPlay}
      className={className}
      src={src}
      preload="auto"
      poster="./assets/img/poster-default.png"
      muted={muted}
      onCanPlay={onCanPlay}
      onError={onError}
      {...etc}
    />
  );
};
