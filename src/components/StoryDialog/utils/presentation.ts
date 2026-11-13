import type { BookDialogMode } from '@active-book/types';

/** Read-only structural view of model nodes. This does not extend the supported document schema. */
export type DialogContentNode = {
  readonly type: string;
  readonly content?: readonly DialogContentNode[];
};

const getSingleMediaMode = (nodes: readonly DialogContentNode[]): BookDialogMode => {
  if (nodes.length !== 1) {
    return 'default';
  }

  const node = nodes[0];

  if (node.type === 'image' || node.type === 'video') {
    return 'media';
  }

  return 'default';
};

export const getDialogMode = (nodes: readonly DialogContentNode[], selectedIndex = 0): BookDialogMode => {
  if (nodes.length !== 1 || nodes[0].type !== 'carousel') {
    return getSingleMediaMode(nodes);
  }

  const slide = nodes[0].content?.[selectedIndex];

  if (!slide || slide.type !== 'carouselSlide') {
    return 'default';
  }

  return getSingleMediaMode(slide.content ?? []);
};
