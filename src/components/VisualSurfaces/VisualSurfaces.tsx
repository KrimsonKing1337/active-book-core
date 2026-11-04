import classNames from 'classnames';
import { createPortal } from 'react-dom';

import { useBookApplicationSurface } from '@components/BookApplicationSurface/context';
import { geometryInApplication } from '@components/BookApplicationSurface/geometry';

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
  const application = useBookApplicationSurface();
  const applicationGeometry = geometryInApplication(geometry);
  const hosts = ['story', 'underStory', 'aboveStory'] as const;

  return (
    <>
      {hosts.flatMap((hostCur) => planes.map((planeCur) => {
        const planeItems = items.filter((itemCur) => {
          return itemCur.depth.plane === planeCur && (itemCur.host ?? 'story') === hostCur;
        });

        const planeItemsSorted = planeItems.sort(compareVisualSurfaces);

        const planeClassNames = classNames(styles.Plane, styles[planeCur]);

        const isFeedback = planeCur === 'systemFeedback' && !!application;
        const external = hostCur !== 'story' || isFeedback;
        let target = application?.hosts.feedback;

        if (!isFeedback && hostCur !== 'story') {
          target = application?.hosts[hostCur];
        }
        const key = `${hostCur}/${planeCur}`;
        const content = (
          <div
            key={key}
            className={planeClassNames}
            data-visual-plane={planeCur}
            inert
          >
            {planeItemsSorted.map((itemCur, index) => {
              return (
                <VisualSurface
                  key={itemCur.id}
                  item={itemCur}
                  geometry={external ? applicationGeometry : geometry}
                  order={index}
                />
              );
            })}
          </div>
        );

        if (external) {
          return target ? createPortal(content, target, key) : null;
        }

        return content;
      }))}
    </>
  );
};
