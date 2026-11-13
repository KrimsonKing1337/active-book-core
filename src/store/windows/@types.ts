export type WindowKind =
  | 'content'
  | 'menu'
  | 'tableOfContents'
  | 'bookmarks'
  | 'legacy';

export type StoryWindow = {
  kind: WindowKind;
  instanceId: string;
  contentId: string;
  canClose: boolean;
};

export type WindowSession = {
  sessionId: string;
  pageId: string | null;
};

export type OpenWindowOptions = WindowSession & {
  kind?: WindowKind;
  contentId: string;
  canClose?: boolean;
};

export type WindowTarget = {
  sessionId: string;
  instanceId: string;
};

export type State = {
  sessionId: string | null;
  pageId: string | null;
  activeWindow: StoryWindow | null;
};
