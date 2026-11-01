import type { VisualPlane } from '@active-book/types';

import classNames from 'classnames';

import type { BookGeometry } from '@components/BookVisualRoot/geometry';

import type { VisualSurfaceItem } from './@types';

import { VisualSurface } from './components/VisualSurface';
import { compareVisualSurfaces } from './utils/order';

import * as styles from './VisualSurfaces.module.scss';

type VisualSurfacesProps = {
  items: readonly VisualSurfaceItem[];
  geometry: BookGeometry | null;
};

const planes: readonly VisualPlane[] = ['scene', 'aboveNarrative', 'aboveControls'];

export const VisualSurfaces = ({ items, geometry }: VisualSurfacesProps) => {
  return (
    <>
      {planes.map((planeCur) => {
        const planeItems = items.filter((itemCur) => itemCur.depth.plane === planeCur).sort(compareVisualSurfaces);
        const planeClassNames = classNames(styles.Plane, styles[planeCur]);

        return (
          <div
            key={planeCur}
            className={planeClassNames}
            data-visual-plane={planeCur}
            inert
          >
            {planeItems.map((itemCur, index) => {
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
