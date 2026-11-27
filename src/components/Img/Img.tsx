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

  let source: typeof src;

  if (slideActive && loading !== 'lazy') {
    source = src;
  }

  useMediaReadiness(ref, source);

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
