import type { PropsWithChildren } from 'react';

import { useLayoutEffect, useRef } from 'react';

import classNames from 'classnames';

import { VideoPlaybackContext } from '@components/Video/context';

import styles from '../WithModal.module.scss';

type DialogMediaProps = PropsWithChildren & {
  isMedia: boolean;
  isCurrentWindow: () => boolean;
};

export const DialogMedia = ({
  children,
  isMedia,
  isCurrentWindow,
}: DialogMediaProps) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const videos = bodyRef.current?.querySelectorAll('video');

    if (!videos || !isCurrentWindow()) {
      return;
    }

    const handlePlayError = (video: HTMLVideoElement, error: unknown) => {
      if (!video.isConnected || !isCurrentWindow()) {
        return;
      }

      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        video.controls = true;

        return;
      }

      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.warn('Dialog video could not start', error);
      }
    };

    videos.forEach((video) => {
      video.autoplay = false;
      video.currentTime = 0;
      void video.play().catch((error: unknown) => handlePlayError(video, error));
    });

    return () => {
      videos.forEach((video) => {
        video.pause();
        video.currentTime = 0;
      });
    };
  }, [isCurrentWindow]);

  const bodyClassName = classNames({ [styles.Media]: isMedia });

  return (
    <VideoPlaybackContext value="dialog">
      <div ref={bodyRef} className={bodyClassName}>
        {children}
      </div>
    </VideoPlaybackContext>
  );
};
