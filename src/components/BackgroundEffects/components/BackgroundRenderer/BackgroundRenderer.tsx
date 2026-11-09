import type { CSSProperties, PropsWithChildren } from 'react';

import type { JsonObject, VisualRendererProps } from '@active-book/types';

import type { BackgroundEffect } from '@hooks/effects/background/@types';

import { Video } from '@components/Video';
import { Img } from '@components/Img';

import { Shadow } from '../Shadow';

import { useMediaReadiness } from './useMediaReadiness';

import * as styles from '../../BackgroundEffects.module.scss';

type BackgroundParams = JsonObject & Omit<BackgroundEffect, 'id'>;

export type BackgroundRendererProps = PropsWithChildren & VisualRendererProps;

export const BackgroundRenderer = ({
  id,
  params,
  children,
}: BackgroundRendererProps) => {
  const options = params as BackgroundParams;

  const imageSrc = options.kind === 'image' ? options.image?.src : undefined;
  const imageLoad = useMediaReadiness<HTMLImageElement>('images', imageSrc);

  const videoSrc = options.kind === 'video' ? options.video?.src : undefined;
  const videoLoad = useMediaReadiness<HTMLVideoElement>('videos', videoSrc);

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
          passedRef={imageLoad.elementRef}
          src={image.src}
          className={styles.Media}
          style={image.style}
          onLoad={imageLoad.markReady}
          onError={imageLoad.markReady}
        />
      )}

      {showVideo && (
        <Video
          preserveTime={false}
          elementRef={videoLoad.elementRef}
          id={video.id}
          src={video.src}
          className={styles.Media}
          style={video.style}
          autoPlay={video.autoPlay ?? true}
          loop={video.loop ?? true}
          muted={video.muted ?? true}
          relativeVolume={videoRelativeVolume}
          onCanPlay={videoLoad.markReady}
          onError={videoLoad.markReady}
        />
      )}

      {kind === 'component' && (
        children
      )}
    </div>
  );
};
