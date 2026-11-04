import classNames from 'classnames';

import type { StoryGeometry } from '@components/StoryVisualRoot/geometry';

import type { VisualSurfaceItem } from './@types';

import { VisualSurface } from './components';

import { compareVisualSurfaces } from './utils/order';

import * as styles from './VisualSurfaces.module.scss';

type VisualSurfacesProps = {
  items: readonly VisualSurfaceItem[];
  geometry: StoryGeometry | null;
};

const planes: readonly VisualSurfaceItem['depth']['plane'][] = [
  'background',
  'belowNarrative',
  'aboveNarrative',
  'aboveControls',
  'systemFeedback',
];

export const VisualSurfaces = ({ items, geometry }: VisualSurfacesProps) => {
  return (
    <>
      {planes.map((planeCur) => {
        const planeItems = items.filter((itemCur) => {
          return itemCur.depth.plane === planeCur;
        });

        const planeItemsSorted = planeItems.sort(compareVisualSurfaces);

        const planeClassNames = classNames(styles.Plane, styles[planeCur]);

        return (
          <div
            key={planeCur}
            className={planeClassNames}
            data-visual-plane={planeCur}
            inert
          >
            {planeItemsSorted.map((itemCur, index) => {
              return (
                <VisualSurface
                  key={itemCur.id}
                  item={itemCur}
                  geometry={geometry}
                  order={index}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
};
