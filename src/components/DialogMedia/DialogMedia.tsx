import type { PropsWithChildren } from 'react';

import {
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import classNames from 'classnames';

import { VideoPlaybackContext } from '@components/Video/context';

import {
  getVideoStats,
  handleVideoPlayError,
  reportUnexpectedVideoError,
} from '@components/Video/utils';

import styles from './DialogMedia.module.scss';

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
  const startedRef = useRef(new WeakSet<HTMLVideoElement>());

  const scope = useMemo(() => {
    return { isCurrentWindow };
  }, [isCurrentWindow]);

  useLayoutEffect(() => {
    const body = bodyRef.current;

    if (!body || !isCurrentWindow()) {
      return;
    }

    const videos = body.querySelectorAll('video');

    videos.forEach((video) => {
      if (video.dataset.videoManaged === 'true') {
        return;
      }

      // Native carousel media must opt into Video's React activity contract.
      if (video.closest('[data-book-carousel]')) {
        video.autoplay = false;
        video.pause();

        return;
      }

      if (startedRef.current.has(video)) {
        return;
      }

      startedRef.current.add(video);

      video.autoplay = false;
      video.currentTime = 0;

      const source = video.getAttribute('src');

      video.play().then(() => {
        if (!video.isConnected || !isCurrentWindow()) {
          video.pause();
          video.currentTime = 0;
        }
      }).catch((error: unknown) => {
        const { isConnected, sourceIsEqual } = getVideoStats(video, source);

        if (isConnected && isCurrentWindow() && sourceIsEqual) {
          handleVideoPlayError(video, error);
        } else {
          reportUnexpectedVideoError(source, error);
        }
      });
    });

    return () => {
      const finish = () => {
        if (body.isConnected && isCurrentWindow()) {
          return;
        }

        const allHtmlVideos = body.querySelectorAll('video');
        const remaining = new Set([...videos, ...allHtmlVideos]);

        remaining.forEach((videoCur) => {
          videoCur.pause();
          videoCur.currentTime = 0;
        });
      };

      // StrictMode reconnects this same scope before the microtask runs.
      if (!isCurrentWindow() || !body.isConnected) {
        finish();
      } else {
        queueMicrotask(finish);
      }
    };
  }, [isCurrentWindow]);

  const bodyClassName = classNames(styles.Content, {
    [styles.Media]: isMedia,
  });

  return (
    <VideoPlaybackContext value={scope}>
      <div ref={bodyRef} className={bodyClassName} data-video-scope="dialog">
        {children}
      </div>
    </VideoPlaybackContext>
  );
};
