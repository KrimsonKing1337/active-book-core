import { useRef } from 'react';

import { useMediaReadiness } from '@hooks/pagePresentation/useMediaReadiness';

import { useCarouselSlideActive } from '@components/Carousel/context';

export type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  passedRef?: React.RefObject<HTMLImageElement | null>;
  className?: string;
  src: string;
  onLoad?: () => void;
  onError?: () => void;
};

export const Img = ({
  passedRef,
  className = '',
  src,
  onLoad,
  onError,
  loading,
  ...etc
}: ImgProps) => {
  const ownRef = useRef<HTMLImageElement>(null);
  const ref = passedRef ?? ownRef;

  const slideActive = useCarouselSlideActive();

  useMediaReadiness(ref, slideActive && loading !== 'lazy' ? src : undefined);

  return (
    <img
      ref={ref}
      loading={loading}
      className={className}
      src={src}
      alt=""
      onLoad={onLoad}
      onError={onError}
      {...etc}
    />
  );
};
