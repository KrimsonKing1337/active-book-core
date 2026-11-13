import type { ReactNode } from 'react';

import type { BookDialogMode } from '@active-book/types';

import type { StoryDialogProps } from '@components/StoryDialog/@types';
import type { DialogContentNode } from '@components/StoryDialog/utils/presentation';

type ContentOptions = Pick<
  StoryDialogProps,
  | 'title'
  | 'description'
  | 'width'
  | 'height'
>;

type ReactContent = {
  children?: ReactNode;
  mode?: BookDialogMode;
  nodes?: never;
  render?: never;
};

type ModelContent = {
  /** Immutable structural snapshot for this window instance, not an authoring schema. */
  nodes: readonly DialogContentNode[];
  render: (onSelect: (index: number) => void) => ReactNode;
  children?: never;
  mode?: never;
};

export type StoryWindowContent = ContentOptions & (ReactContent | ModelContent);

export type StoryWindowHostProps = {
  /** Resolve directly from the owner's content model; no global component registry. */
  resolveContent: (contentId: string) => StoryWindowContent;
};
