import {
  type PropsWithChildren,

  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { useDispatch, useSelector } from 'store';

import { backgroundEffectsSelectors } from 'store/effects/background';
import { effectsActions } from 'store/effects/common';

import { Videos, Images, Shadow, Wrapper } from './components';

import * as styles from './BackgroundEffects.module.scss';

type MediaKind = 'image' | 'video';

const Child = memo(({ children }: PropsWithChildren) => {
  return (
    <Fragment>
      {children}
    </Fragment>
  );
});

export const BackgroundEffects = memo(() => {
  const dispatch = useDispatch();

  const effects = useSelector(backgroundEffectsSelectors.effects);

  const loadedImagesRef = useRef(new Set<string>());
  const loadedVideosRef = useRef(new Set<string>());

  const imageKeys = useMemo(() => {
    return Object.values(effects).flatMap((effectCur) => {
      const images = effectCur.images?.filter((imageCur) => imageCur.src.trim()) ?? [];

      return images.map((imageCur) => {
        return JSON.stringify([effectCur.id, imageCur.id, imageCur.src]);
      });
    });
  }, [effects]);

  const videoKeys = useMemo(() => {
    return Object.values(effects).flatMap((effectCur) => {
      const videos = effectCur.videos?.filter((videoCur) => videoCur.src.trim()) ?? [];

      return videos.map((videoCur) => {
        return JSON.stringify([effectCur.id, videoCur.id, videoCur.src]);
      });
    });
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
        videos: allVideos = [],
        images: allImages = [],
        Component = null,
        shadow = {},
        style = {},
      } = effectCur;

      const images = allImages.filter((imageCur) => imageCur.src.trim());
      const videos = allVideos.filter((videoCur) => videoCur.src.trim());

      const wrapperZIndex = style.zIndex
        ?? images[0]?.style?.zIndex
        ?? videos[0]?.style?.zIndex
        ?? shadow.style?.zIndex;

      const wrapperStyle = {
        ...style,
        zIndex: wrapperZIndex,
      };

      const hasBackgroundStyle = Object.keys(style).length > 0;

      const isVisible =
        !!videos.length
        || !!images.length
        || !!Component
        || !!shadow.show
        || hasBackgroundStyle;

      if (!isVisible) {
        return null;
      }

      return (
        <Child key={id}>
          <div
            id={`effect-${id}`}
            data-effect-id={id}
            style={wrapperStyle}
            className={styles.BackgroundObjectsWrapper}
          >
            <Shadow options={shadow} />

            {Component}

            <Videos backgroundId={id} videos={videos} onReady={markReady} />
            <Images backgroundId={id} images={images} onReady={markReady} />
          </div>
        </Child>
      );
    });
  }, [effects, markReady]);

  return (
    <Wrapper id="background-effects">
      {backgroundWrappers}
    </Wrapper>
  );
});
