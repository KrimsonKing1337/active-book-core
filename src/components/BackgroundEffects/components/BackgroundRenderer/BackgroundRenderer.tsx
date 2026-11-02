import type { JsonObject, VisualRendererProps } from '@active-book/types';

import { useVisualEffects } from '@@/controllers/visualEffects/context';

import type { BackgroundEffect } from '@hooks/effects/background/@types';

import { Video } from '@components/Video';
import { Img } from '@components/Img';

import { Shadow } from '../Shadow';

import { useMediaReadiness } from './useMediaReadiness';

import * as styles from '../../BackgroundEffects.module.scss';

type BackgroundParams = JsonObject & Omit<BackgroundEffect, 'id' | 'Component'>;

export const BackgroundRenderer = ({ id, params }: VisualRendererProps) => {
  const session = useVisualEffects();
  // Built-in parameters are the JSON copy of the typed Background declaration, without runtime nodes.
  const options = params as BackgroundParams;
  const effectCur = {
    ...options,
    id,
    Component: session.getRuntimeComponent(id),
  };
  const imageSource = options.kind === 'image' ? options.image?.src : undefined;
  const imageLoad = useMediaReadiness<HTMLImageElement>('images', imageSource);
  const videoSource = options.kind === 'video' ? options.video?.src : undefined;
  const videoLoad = useMediaReadiness<HTMLVideoElement>('videos', videoSource);

  const {
    kind,
    image,
    video,
    shadow,
    style = {},
    Component,
  } = effectCur;

  const zIndex = style.zIndex
    ?? image?.style?.zIndex
    ?? video?.style?.zIndex
    ?? shadow?.style?.zIndex;

  const wrapperStyle = kind === 'background' ? style : { zIndex };

  const showShadow = kind === 'shadow' && shadow;
  const showImage = kind === 'image' && image && image?.src.trim();
  const showVideo = kind === 'video' && video && video?.src.trim();
  const componentContent = kind === 'component' ? Component : null;

  return (
    <div
      id={`effect-${id}`}
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
          relativeVolume={video.relativeVolume ?? 100}
          onCanPlay={videoLoad.markReady}
          onError={videoLoad.markReady}
        />
      )}

      {componentContent}
    </div>
  );
};
