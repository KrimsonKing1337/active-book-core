import { createPortal } from 'react-dom';

import type { StoryGeometry } from '@components/StoryRoot/geometry';
import type { VisualSurfaceItem } from '@components/VisualSurfaces';


import { useBookApplicationSurface } from '@components/BookApplicationSurface/context';
import { geometryInApplication } from '@components/BookApplicationSurface/geometry';

import * as styles from './VisualSelectionOutline.module.scss';

type VisualSelectionOutlineProps = {
  item?: VisualSurfaceItem;
  geometry: StoryGeometry | null;
};

/** Editor-only region bounds, independent of the effect's surface and masks. */
export const VisualSelectionOutline = ({ item, geometry }: VisualSelectionOutlineProps) => {
  const application = useBookApplicationSurface();
  const displayGeometry = application ? geometryInApplication(geometry) : geometry;
  let region = null;

  if (item && !item.hidden) {
    region = displayGeometry?.regions[item.visibility.region];
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

  const content = (
    <div
      className={styles.Outline}
      style={outlineStyle}
      data-visual-selection={item.id}
      aria-hidden="true"
      inert
    />
  );

  return application ? application.hosts.selection && createPortal(content, application.hosts.selection) : content;
};
