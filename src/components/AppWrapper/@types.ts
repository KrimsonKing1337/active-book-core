import type { ReactNode, Ref } from 'react';

import type { VisualEffectDefinition, VisualEffectRegistration } from '@active-book/types';

import type { Config, RangeEffects, TableOfContents } from '@types';

import type { VisualEffects } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

export type AppWrapperProps = {
  config: Config;
  bookKey?: string | number;
  hiddenVisualEffects?: readonly string[];
  registrations?: readonly VisualEffectRegistration[];
  definitions?: readonly VisualEffectDefinition[];
  tableOfContents: TableOfContents;
  rangeEffects: RangeEffects;
  editorTools?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  visualSurfaces?: readonly VisualSurfaceItem[];
  visualEffects?: VisualEffects;
};
