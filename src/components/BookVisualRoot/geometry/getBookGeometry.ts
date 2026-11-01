import type { BookGeometry, BookRegionRect, FrameInsets } from './@types';

const measureRegion = (element: HTMLElement | null, bookRect: DOMRect): BookRegionRect | null => {
  if (!element || element.getClientRects().length === 0) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  const x = rect.left - bookRect.left;
  const y = rect.top - bookRect.top;

  return {
    x,
    y,
    width: rect.width,
    height: rect.height,
  };
};

/** Reads only the fixed book regions; this does not apply clipping or coordinate transforms. */
export const getBookGeometry = (book: HTMLElement): BookGeometry => {
  const bookRect = book.getBoundingClientRect();
  const page = book.querySelector<HTMLElement>('[data-book-region~="page"]');
  const viewport = book.querySelector<HTMLElement>('[data-book-region="narrativeViewport"]');
  const content = book.querySelector<HTMLElement>('[data-book-region="narrativeContent"]');

  const pageRect = measureRegion(page, bookRect);
  let viewportRect = measureRegion(viewport, bookRect);
  let contentRect = measureRegion(content, bookRect);
  let frameInsets: FrameInsets | null = null;

  if (viewport && viewportRect) {
    const x = viewportRect.x + viewport.clientLeft;
    const y = viewportRect.y + viewport.clientTop;

    viewportRect = {
      x,
      y,
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    };

    // Narrative already resolves --frame-* through its padding, including clamp().
    const style = getComputedStyle(viewport);

    frameInsets = {
      top: Number.parseFloat(style.paddingTop),
      right: Number.parseFloat(style.paddingRight),
      bottom: Number.parseFloat(style.paddingBottom),
      left: Number.parseFloat(style.paddingLeft),
    };
  }

  if (content && contentRect) {
    contentRect = {
      ...contentRect,
      width: Math.max(contentRect.width, content.scrollWidth),
      height: Math.max(contentRect.height, content.scrollHeight),
    };
  }

  const bookRegion = {
    x: 0,
    y: 0,
    width: bookRect.width,
    height: bookRect.height,
  };

  const regions: BookGeometry['regions'] = {
    book: bookRegion,
    page: pageRect,
    frame: pageRect,
    narrativeViewport: viewportRect,
    narrativeContent: contentRect,
  };

  return {
    regions,
    frameInsets,
  };
};
