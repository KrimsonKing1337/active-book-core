import type { BookDialogMode } from '@active-book/types';

/** Read-only structural view of model nodes. This does not extend the supported document schema. */
type ContentNode = {
  readonly type: string;
  readonly content?: readonly ContentNode[];
};

const getSingleMediaMode = (nodes: readonly ContentNode[]): BookDialogMode => {
  if (nodes.length !== 1) {
    return 'default';
  }

  const node = nodes[0];

  if (node.type === 'image' || node.type === 'video') {
    return 'media';
  }

  return 'default';
};

export const getDialogMode = (nodes: readonly ContentNode[], selectedIndex = 0): BookDialogMode => {
  if (nodes.length !== 1 || nodes[0].type !== 'carousel') {
    return getSingleMediaMode(nodes);
  }

  const slide = nodes[0].content?.[selectedIndex];

  if (!slide || slide.type !== 'carouselSlide') {
    return 'default';
  }

  return getSingleMediaMode(slide.content ?? []);
};
