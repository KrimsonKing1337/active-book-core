import type { ReactNode, Ref } from 'react';

import type { Config, RangeEffects, TableOfContents } from '@types';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

import type { VisualEffects } from '../../controllers/visualEffects';

export type AppWrapperProps = {
  config: Config;
  tableOfContents: TableOfContents;
  rangeEffects: RangeEffects;
  editorTools?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  visualSurfaces?: readonly VisualSurfaceItem[];
  visualEffects?: VisualEffects;
};
