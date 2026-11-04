import { useVisualRegionGeometry } from '@components/RegisteredVisualEffect/geometryContext';

import * as styles from './ViewportTelemetry.module.scss';

/** Host diagnostic overlay makes the otherwise fully occluded collapse visible to the experimenter. */
export const ViewportTelemetry = () => {
  const { geometry, surface } = useVisualRegionGeometry();
  const region = geometry?.regions.storyViewport;

  if (!region || !surface) {
    return null;
  }

  const style = {
    left: region.x - surface.x,
    top: region.y - surface.y,
    width: region.width,
    height: region.height,
  };

  return (
    <div className={styles.Telemetry} style={style} data-testid="viewport-telemetry">
      <span>
        VIEWPORT · {Math.round(region.width)} × {Math.round(region.height)}
      </span>
    </div>
  );
};
