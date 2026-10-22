import { type PropsWithChildren, Fragment, memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useDispatch, useSelector } from 'store';

import { backgroundEffectsSelectors } from 'store/effects/background';
import { effectsActions } from 'store/effects/common';

import { Videos, Images, Shadow, Dots, Wrapper } from './components';

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
    return Object.values(effects).flatMap((effect) => {
      return (effect.images ?? []).map((image, index) => JSON.stringify([effect.id, index, image.src]));
    });
  }, [effects]);

  const videoKeys = useMemo(() => {
    return Object.values(effects).flatMap((effect) => {
      return (effect.videos ?? []).map((video) => JSON.stringify([effect.id, video.id, video.src]));
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
    return Object.values(effects).map((effect) => {
      const {
        id,
        videos = [],
        images = [],
        Component = null,
        shadow = {},
        style = {},
      } = effect;

      const isVisible = !!videos.length || !!images.length || !!Component || !!shadow.show;

      if (!isVisible) {
        return null;
      }

      return (
        <Child key={id}>
          <div style={style} className={styles.BackgroundObjectsWrapper}>
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
      <Dots />

      {backgroundWrappers}
    </Wrapper>
  );
});
