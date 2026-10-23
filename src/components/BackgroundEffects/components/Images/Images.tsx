import type { BackgroundEffectMediaOptions } from 'hooks/effects/background/@types';

import { Img } from 'components/Img';

import * as styles from './Images.module.scss';

export type ImagesProps = {
  backgroundId: string;
  images: BackgroundEffectMediaOptions[];
  onReady: (kind: 'image' | 'video', key: string) => void;
};

export const Images = ({ backgroundId, images, onReady }: ImagesProps) => {
  return images.map((imageCur) => {
    const { id, src, style } = imageCur;

    const mediaKey = JSON.stringify([backgroundId, id, src]);

    const handleReady = () => {
      onReady('image', mediaKey);
    };

    return (
      <Img
        key={id}
        style={style}
        className={styles.Img}
        src={src}
        onLoad={handleReady}
        onError={handleReady}
      />
    );
  });
};
