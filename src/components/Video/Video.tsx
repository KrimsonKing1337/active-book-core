import type { RefObject } from 'react';

import {
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import { useSelector } from '@store';
import { volumeSelectors } from '@store/volume';

import { VideoPlaybackContext } from './context';
import { useVideoPlayback, useVideoTime } from './hooks';

type VideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
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
  const playbackOwner = useContext(VideoPlaybackContext);

  const { videos: videosVolume, global: globalVolume } = useSelector(volumeSelectors.all);

  const ownRef = useRef<HTMLVideoElement>(null);
  const ref = elementRef ?? ownRef;

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    element.volume = (videosVolume / 100) * (relativeVolume / 100) * (globalVolume / 100);

    element.setAttribute('data-relativeVolume', relativeVolume.toString());
  }, [
    videosVolume,
    globalVolume,
    relativeVolume,
    ref,
  ]);

  const shouldPreserveTime = preserveTime && playbackOwner === null;

  useVideoTime(ref, {
    id,
    src,
    preserveTime: shouldPreserveTime,
  });

  const isManaged = useVideoPlayback(ref, {
    id,
    src,
    autoPlay,
    preserveTime,
  });

  const shouldAutoPlay = autoPlay && !isManaged;

  return (
    <video
      ref={ref}
      data-id={id}
      data-autoplay={shouldAutoPlay}
      data-video-managed={isManaged}
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
