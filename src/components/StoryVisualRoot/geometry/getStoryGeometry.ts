import type { StoryGeometry, StoryRegionRect, FrameInsets } from './@types';

import { getRegionCorners } from './regionCorners';

const measureRegion = (
  element: HTMLElement | null,
  storyRect: DOMRect,
): StoryRegionRect | null => {
  if (!element || element.getClientRects().length === 0) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  const x = rect.left - storyRect.left;
  const y = rect.top - storyRect.top;

  return {
    x,
    y,
    width: rect.width,
    height: rect.height,
  };
};

/** Reads only the fixed story regions; this does not apply clipping or coordinate transforms. */
export const getStoryGeometry = (story: HTMLElement): StoryGeometry => {
  const storyRect = story.getBoundingClientRect();

  const narrativeFrame = story.querySelector<HTMLElement>('[data-story-region~="narrativeFrame"]');
  const storyViewport = story.querySelector<HTMLElement>('[data-story-region="storyViewport"]');
  const viewport = story.querySelector<HTMLElement>('[data-story-region="narrativeViewport"]');
  const content = story.querySelector<HTMLElement>('[data-story-region="narrativeContent"]');

  const narrativeFrameRect = measureRegion(narrativeFrame, storyRect);
  const storyViewportRect = measureRegion(storyViewport, storyRect);

  if (storyViewport && storyViewportRect) {
    const style = getComputedStyle(storyViewport);

    storyViewportRect.borderRadius = style.borderRadius;

    if (narrativeFrameRect) {
      narrativeFrameRect.borderRadius = getRegionCorners({
        region: narrativeFrameRect,
        clip: storyViewportRect,
        style,
      });
    }
  }

  let viewportRect = measureRegion(viewport, storyRect);
  let contentRect = measureRegion(content, storyRect);

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

  const storyRegion = {
    x: 0,
    y: 0,
    width: storyRect.width,
    height: storyRect.height,
  };

  const regions: StoryGeometry['regions'] = {
    story: storyRegion,
    storyViewport: storyViewportRect,
    narrativeFrame: narrativeFrameRect,
    frame: narrativeFrameRect,
    narrativeViewport: viewportRect,
    narrativeContent: contentRect,
  };

  return {
    regions,
    frameInsets,
  };
};
