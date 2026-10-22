import type { BackgroundEffectVideoOptions } from 'hooks/effects/background/@types';

import { Video } from 'components/Video';

import * as styles from './Videos.module.scss';

export type VideosProps = {
  backgroundId: string;
  videos: BackgroundEffectVideoOptions[];
  onReady: (kind: 'image' | 'video', key: string) => void;
};

export const Videos = ({ backgroundId, videos, onReady }: VideosProps) => {
  return videos.map((videoCur) => {
    const {
      id,
      src,
      style,
      autoPlay = true,
      loop = true,
      muted = true,
      relativeVolume = 100,
    } = videoCur;

    const mediaKey = JSON.stringify([backgroundId, id, src]);

    const handleReady = () => {
      onReady('video', mediaKey);
    };

    return (
      <Video
        key={id}
        id={id}
        style={style}
        className={styles.Video}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        relativeVolume={relativeVolume}
        onCanPlay={handleReady}
        onError={handleReady}
      />
    );
  });
};
