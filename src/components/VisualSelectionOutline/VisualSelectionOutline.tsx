import type { StoryGeometry } from '@components/StoryVisualRoot/geometry';
import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import * as styles from './VisualSelectionOutline.module.scss';

type VisualSelectionOutlineProps = {
  item?: VisualSurfaceItem;
  geometry: StoryGeometry | null;
};

/** Editor-only region bounds, independent of the effect's surface and masks. */
export const VisualSelectionOutline = ({ item, geometry }: VisualSelectionOutlineProps) => {
  let region = null;

  if (item && !item.hidden) {
    region = geometry?.regions[item.visibility.region];
  }

  if (!item || !region) {
    return null;
  }

  const outlineStyle = {
    left: region.x,
    top: region.y,
    width: region.width,
    height: region.height,
    borderRadius: region.borderRadius,
  };

  return (
    <div
      className={styles.Outline}
      style={outlineStyle}
      data-visual-selection={item.id}
      aria-hidden="true"
      inert
    />
  );
};
