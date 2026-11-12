import type { StoryDialogProps } from '@components/StoryDialog';

export type StoryWindowContent = Pick<
  StoryDialogProps,
  | 'children'
  | 'title'
  | 'description'
  | 'width'
  | 'height'
  | 'mode'
>;

export type StoryWindowHostProps = {
  /** Resolve directly from the owner's content model; no global component registry. */
  resolveContent: (contentId: string) => StoryWindowContent;
};
