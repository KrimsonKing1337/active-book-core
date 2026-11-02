import type { RefObject } from 'react';

import { useEffect, useRef } from 'react';

import { useDispatch, useSelector, useStore } from '@store';

import { volumeSelectors } from '@store/volume';
import { effectsActions } from '@store/effects/common';

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
  const store = useStore();

  const ownRef = useRef<HTMLVideoElement>(null);
  const refCurrentTime = useRef(0);

  const ref = elementRef ?? ownRef;

  const { videos: videosVolume, global: globalVolume } = useSelector(volumeSelectors.all);

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
    const element = ref.current;
    if (!element) {
      return;
    }

    element.volume = (videosVolume / 100) * (relativeVolume / 100) * (globalVolume / 100);
    element.setAttribute('data-relativeVolume', relativeVolume.toString());
  }, [videosVolume, globalVolume, relativeVolume, ref]);

  useEffect(() => {
    const element = ref.current;
    const savedTime = store.getState().effects.videosCurrentTime[id];
    if (!element || !preserveTime || !savedTime) {
      return;
    }

    const restoreTime = () => {
      element.currentTime = savedTime;
    };
    if (element.readyState >= 1) {
      restoreTime();
    } else {
      element.addEventListener('loadedmetadata', restoreTime, { once: true });
    }

    return () => element.removeEventListener('loadedmetadata', restoreTime);
  }, [id, src, preserveTime, ref, store]);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    refCurrentTime.current = element.currentTime;
    const handleTimeUpdate = () => {
      refCurrentTime.current = element.currentTime;
    };
    element.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      element.removeEventListener('timeupdate', handleTimeUpdate);
      if (preserveTime && refCurrentTime.current) {
        dispatch(effectsActions.setVideoCurrentTime({
          id,
          currentTime: refCurrentTime.current,
        }));
      }
    };
  }, [id, src, preserveTime, ref, dispatch]);

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
