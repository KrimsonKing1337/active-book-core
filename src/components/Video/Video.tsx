import type { RefObject } from 'react';

import {
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import { useSelector } from '@store';
import { volumeSelectors } from '@store/volume';

import { useMediaReadiness } from '@hooks/pagePresentation/useMediaReadiness';

import { useCarouselSlideActive } from '@components/Carousel/context';

import { getMediaVolume } from '@utils/volume/getMediaVolume';

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
  preload = 'auto',
  elementRef,

  onCanPlay,
  onError,
  ...etc
}: VideoProps) => {
  const slideActive = useCarouselSlideActive();
  const playbackOwner = useContext(VideoPlaybackContext);

  const { videos: videosVolume, global: globalVolume } = useSelector(volumeSelectors.all);

  const ownRef = useRef<HTMLVideoElement>(null);
  const ref = elementRef ?? ownRef;

  const required = slideActive && !playbackOwner && preload === 'auto';

  useMediaReadiness(ref, required ? src : undefined);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    let volume = getMediaVolume({
      global: globalVolume / 100,
      category: videosVolume / 100,
      relative: relativeVolume / 100,
    });

    if (document.hidden) {
      volume = 0;
    }

    element.volume = volume;

    const relativeValueAttr = relativeVolume.toString();

    element.setAttribute('data-relativeVolume', relativeValueAttr);
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
      preload={preload}
      poster="./assets/img/poster-default.png"
      muted={muted}
      onCanPlay={onCanPlay}
      onError={onError}
      {...etc}
    />
  );
};
