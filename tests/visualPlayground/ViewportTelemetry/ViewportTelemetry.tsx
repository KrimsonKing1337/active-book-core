import { createPortal } from 'react-dom';

import { useStoryRegions } from '@components/StoryRegionsProvider';

import * as styles from './ViewportTelemetry.module.scss';

/** A local diagnostic follows the real transformed viewport without measuring it each frame. */
export const ViewportTelemetry = () => {
  const { elements } = useStoryRegions();
  const viewport = elements.storyViewport;

  if (!viewport) {
    return null;
  }

  return createPortal(
    <div className={styles.Telemetry} data-testid="viewport-telemetry">
      <span>
        VIEWPORT · CSS transform
      </span>
    </div>,
    viewport,
  );
};
