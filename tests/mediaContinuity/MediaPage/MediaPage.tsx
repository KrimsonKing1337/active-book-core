import { Img } from '@components/Img';
import { useMediaReadiness } from '@components/BackgroundEffects/components/BackgroundRenderer/useMediaReadiness';

export const MediaPage = () => {
  const image = useMediaReadiness<HTMLImageElement>('images', '/delayed-story.svg');

  return (
    <article data-testid="new-content">
      <h1>
        Ready new content
      </h1>

      <Img
        src="/delayed-story.svg"
        passedRef={image.elementRef}
        onLoad={image.markReady}
        onError={image.markReady}
      />
    </article>
  );
};
