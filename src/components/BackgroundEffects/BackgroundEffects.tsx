import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useDispatch, useSelector } from 'store';

import { backgroundEffectsSelectors } from 'store/effects/background';
import { effectsActions } from 'store/effects/common';

import { Video } from 'components/Video';
import { Img } from 'components/Img';

import { Shadow, Wrapper } from './components';

import * as styles from './BackgroundEffects.module.scss';

type MediaKind = 'image' | 'video';

export const BackgroundEffects = memo(() => {
  const dispatch = useDispatch();

  const effects = useSelector(backgroundEffectsSelectors.effects);

  const loadedImagesRef = useRef(new Set<string>());
  const loadedVideosRef = useRef(new Set<string>());

  const { imageKeys, videoKeys } = useMemo(() => {
    const imageKeys: string[] = [];
    const videoKeys: string[] = [];

    for (const effectCur of Object.values(effects)) {
      const {
        id,
        kind,
        image,
        video,
      } = effectCur;

      if (kind === 'image' && image?.src.trim()) {
        imageKeys.push(JSON.stringify([id, image.src]));
      } else if (kind === 'video' && video?.src.trim()) {
        videoKeys.push(JSON.stringify([id, video.src]));
      }
    }

    return {
      imageKeys,
      videoKeys,
    };
  }, [effects]);

  useEffect(() => {
    const currentImages = new Set(imageKeys);
    const currentVideos = new Set(videoKeys);

    loadedImagesRef.current = new Set([...loadedImagesRef.current].filter((key) => currentImages.has(key)));
    loadedVideosRef.current = new Set([...loadedVideosRef.current].filter((key) => currentVideos.has(key)));

    dispatch(effectsActions.setImagesAmount(imageKeys.length));
    dispatch(effectsActions.setImagesReadyAmount(loadedImagesRef.current.size));
    dispatch(effectsActions.setVideosAmount(videoKeys.length));
    dispatch(effectsActions.setVideosReadyAmount(loadedVideosRef.current.size));
  }, [imageKeys, videoKeys, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(effectsActions.setImagesAmount(0));
      dispatch(effectsActions.setImagesReadyAmount(0));
      dispatch(effectsActions.setVideosAmount(0));
      dispatch(effectsActions.setVideosReadyAmount(0));
    };
  }, [dispatch]);

  const markReady = useCallback((kind: MediaKind, key: string) => {
    const isImage = kind === 'image';

    const validKeys = isImage ? imageKeys : videoKeys;
    const loaded = isImage ? loadedImagesRef.current : loadedVideosRef.current;

    if (!validKeys.includes(key) || loaded.has(key)) {
      return;
    }

    loaded.add(key);

    if (isImage) {
      dispatch(effectsActions.setImagesReadyAmount(loaded.size));
    } else {
      dispatch(effectsActions.setVideosReadyAmount(loaded.size));
    }
  }, [imageKeys, videoKeys, dispatch]);

  const backgroundWrappers = useMemo(() => {
    return Object.values(effects).map((effectCur) => {
      const {
        id,
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

      const imageKey = JSON.stringify([id, image?.src]);
      const videoKey = JSON.stringify([id, video?.src]);

      const onImageReady = () => markReady('image', imageKey);
      const onVideoReady = () => markReady('video', videoKey);

      const showShadow = kind === 'shadow' && shadow;
      const showImage = kind === 'image' && image && image?.src.trim();
      const showVideo = kind === 'video' && video && video?.src.trim();
      const showComponent = kind === 'component' && Boolean(Component);

      return (
        <div
          key={id}
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
              src={image.src}
              className={styles.Media}
              style={image.style}
              onLoad={onImageReady}
              onError={onImageReady}
            />
          )}

          {showVideo && (
            <Video
              id={video.id}
              src={video.src}
              className={styles.Media}
              style={video.style}
              autoPlay={video.autoPlay ?? true}
              loop={video.loop ?? true}
              muted={video.muted ?? true}
              relativeVolume={video.relativeVolume ?? 100}
              onCanPlay={onVideoReady}
              onError={onVideoReady}
            />
          )}

          {showComponent && (
            Component
          )}
        </div>
      );
    });
  }, [effects, markReady]);

  return (
    <Wrapper id="background-effects">
      {backgroundWrappers}
    </Wrapper>
  );
});
