import type { CSSProperties, PropsWithChildren } from 'react';

import type { JsonObject, VisualRendererProps } from '@active-book/types';

import type { BackgroundEffect } from '@hooks/effects/background/@types';

import { Video } from '@components/Video';
import { Img } from '@components/Img';

import { Shadow } from '../Shadow';

import * as styles from '../../BackgroundEffects.module.scss';

type BackgroundParams = JsonObject & Omit<BackgroundEffect, 'id'>;

export type BackgroundRendererProps = PropsWithChildren & VisualRendererProps;

export const BackgroundRenderer = ({
  id,
  params,
  children,
}: BackgroundRendererProps) => {
  const options = params as BackgroundParams;

  const {
    kind,
    image,
    video,
    shadow,
    style = {},
  } = options;

  const wrapperStyle: CSSProperties = kind === 'background' || kind === 'component' ? { ...style } : {};

  delete wrapperStyle.zIndex;

  const showShadow = kind === 'shadow' && shadow;
  const showImage = kind === 'image' && image && image?.src.trim();
  const showVideo = kind === 'video' && video && video?.src.trim();

  const videoRelativeVolume = video?.relativeVolume ?? 100;

  return (
    <div
      data-effect-id={id}
      className={styles.BackgroundObjectsWrapper}
      style={wrapperStyle}
    >
      {showShadow && (
        <Shadow options={shadow} />
      )}

      {showImage && (
        <Img
          src={image.src}
          className={styles.Media}
          style={image.style}
        />
      )}

      {showVideo && (
        <Video
          preserveTime={false}
          id={video.id}
          src={video.src}
          className={styles.Media}
          style={video.style}
          autoPlay={video.autoPlay ?? true}
          loop={video.loop ?? true}
          muted={video.muted ?? true}
          relativeVolume={videoRelativeVolume}
        />
      )}

      {kind === 'component' && (
        children
      )}
    </div>
  );
};
