import { useRef } from 'react';

import { Video } from '../../src/components/Video';
import { Carousel } from '../../src/components/Carousel';
import { WithModal } from '../../src/components/ColoredTextTrigger/WithModal';
import { useGoToPage } from '../../src/hooks/control/useGoToPage';

import { Gallery } from './Gallery';

export const Content = () => {
  const otherRef = useRef<HTMLDivElement>(null);
  const { goToPage } = useGoToPage();

  const replace = () => {
    otherRef.current?.querySelector<HTMLElement>('[role="button"]')?.click();
  };

  return (
    <div>
      <Gallery prefix="page" />

      <Video
        id="outside"
        data-testid="outside"
        src="/tests/unifiedVisualEffects/movie.webm?id=outside"
        controls
        loop
        style={{ width: 200, height: 110 }}
      />

      <WithModal text="Video gallery" triggerType="action" mode="default">
        <Gallery prefix="dialog" />
        <button type="button" onClick={replace}>Replace dialog</button>
      </WithModal>

      <div ref={otherRef}>
        <WithModal text="Other dialog" triggerType="action" mode="default">
          <Video
            id="other"
            data-testid="other"
            src="/tests/unifiedVisualEffects/movie.webm?id=other"
            controls
            loop
          />
        </WithModal>
      </div>

      <WithModal text="Native dialog" triggerType="action" mode="default">
        <video
          data-testid="native-dialog"
          src="/tests/unifiedVisualEffects/movie.webm?id=native"
          controls
          muted
          loop
        />
      </WithModal>

      <WithModal text="Native carousel" triggerType="action" mode="default">
        <Carousel
          slides={[<video
            key="a"
            data-testid="native-a"
            controls
            muted
            src="/tests/unifiedVisualEffects/movie.webm"
          />, <video
            key="b"
            data-testid="native-b"
            controls
            muted
            autoPlay
            src="/tests/unifiedVisualEffects/movie.webm"
          />]}
        />
      </WithModal>

      <button type="button" onClick={() => goToPage(2)}>Next page</button>
    </div>
  );
};
