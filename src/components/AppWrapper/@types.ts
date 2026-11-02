import type { ReactNode, Ref } from 'react';

import type { Config, RangeEffects, TableOfContents } from '@types';

import type { VisualEffects } from '@controllers';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

export type AppWrapperProps = {
  config: Config;
  tableOfContents: TableOfContents;
  rangeEffects: RangeEffects;
  editorTools?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  visualSurfaces?: readonly VisualSurfaceItem[];
  visualEffects?: VisualEffects;
};
