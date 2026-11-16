import type { ReactNode, Ref } from 'react';

import type { VisualEffectDefinition, VisualEffectRegistration } from '@active-book/types';

import type { Config, TableOfContents } from '@types';

import type { VisualEffects } from '@controllers/visualEffects';

import type { VisualSurfaceItem } from '@components/VisualSurfaces';

export type StoryPage = {
  id: string;
  content: ReactNode;
};

export type AppWrapperProps = {
  storyPages: readonly StoryPage[];
  initialPageId?: string | null;
  withoutToolbar?: boolean;
  config: Config;
  bookKey?: string | number;
  hiddenVisualEffects?: readonly string[];
  /** Preview selection only; ignored in reader mode. */
  selectedVisualEffectId?: string | null;
  registrations?: readonly VisualEffectRegistration[];
  definitions?: readonly VisualEffectDefinition[];
  tableOfContents: TableOfContents;
  editorTools?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  visualSurfaces?: readonly VisualSurfaceItem[];
  visualEffects?: VisualEffects;
};
