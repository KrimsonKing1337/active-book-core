import { useBackground } from '../../../src/hooks/effects/background';
import { useFrameEffect } from '../../../src/hooks/effects/frame';
import { PageWrapper } from '../../../src/components/PageWrapper';

const image = '/tests/unifiedVisualEffects/pattern.svg';

export const EffectsPage = ({ number }: { number: number }) => {
  useBackground({
    id: `page-bg-${number}`,
    kind: 'background',
    style: { backgroundColor: '#15314a' },
  });
  useBackground({
    id: `page-image-${number}`,
    kind: 'image',
    image: {
      id: 'picture',
      src: image,
      style: {
        opacity: 0.22,
        filter: 'sepia(0.5) blur(1px)',
      },
    },
  });
  useFrameEffect({
    id: `page-shadow-${number}`,
    kind: 'shadow',
    shadow: {
      id: 'shadow',
      sides: ['top', 'left', 'right'],
      thickness: 45,
      style: { color: '#ff6a00' },
    },
  });
  useFrameEffect({
    id: `page-text-${number}`,
    kind: 'text',
    layer: 'above',
    text: {
      id: 'text',
      leftText: 'ЛЕВАЯ РАМКА',
      rightText: 'ПРАВАЯ РАМКА',
      style: {
        color: '#d7f8ff',
        fontSize: '14px',
      },
      animation: {
        preset: 'scroll',
        duration: 5000,
        playState: 'paused',
      },
    },
  });
  useFrameEffect({
    id: `page-mask-${number}`,
    kind: 'component',
    layer: 'above',
    style: { backgroundColor: 'rgba(0, 255, 128, 0.3)' },
    frameMask: {
      enabled: true,
      sides: ['right', 'bottom'],
    },
  });

  return (
    <PageWrapper>
      <h2>
        Страница {number}
      </h2>
      <article
        style={{
          height: 1700,
          background: 'rgba(80, 100, 120, 0.4)',
        }}
      >
        Самостоятельный текст страницы
      </article>
    </PageWrapper>
  );
};
