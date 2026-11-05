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
export const getStoryGeometry = (story: HTMLElement, application?: HTMLElement | null): StoryGeometry => {
  const storyRect = story.getBoundingClientRect();

  const narrativeFrame = story.querySelector<HTMLElement>('[data-story-region~="narrativeFrame"]');
  const storyViewport = story.querySelector<HTMLElement>('[data-story-region="storyViewport"]');
  const viewport = story.querySelector<HTMLElement>('#narrative');
  const content = story.querySelector<HTMLElement>('[data-story-region="narrativeContent"]');
  const physicalScale = storyViewport?.dataset.layoutMode === 'scale'
    ? Number.parseFloat(storyViewport.style.getPropertyValue('--visual-layout-factor'))
    : 1;
  const clientScale = Number.isFinite(physicalScale) ? physicalScale : 1;

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
    const x = viewportRect.x + viewport.clientLeft * clientScale;
    const y = viewportRect.y + viewport.clientTop * clientScale;

    viewportRect = {
      x,
      y,
      width: viewport.clientWidth * clientScale,
      height: viewport.clientHeight * clientScale,
    };

    // Narrative already resolves --frame-* through its padding, including clamp().
    const style = getComputedStyle(viewport);

    frameInsets = {
      top: Number.parseFloat(style.paddingTop) * clientScale,
      right: Number.parseFloat(style.paddingRight) * clientScale,
      bottom: Number.parseFloat(style.paddingBottom) * clientScale,
      left: Number.parseFloat(style.paddingLeft) * clientScale,
    };
  }

  if (content && contentRect) {
    contentRect = {
      ...contentRect,
      width: Math.max(contentRect.width, content.scrollWidth * clientScale),
      height: Math.max(contentRect.height, content.scrollHeight * clientScale),
    };
  }

  const storyRegion = {
    x: 0,
    y: 0,
    width: storyRect.width,
    height: storyRect.height,
  };

  const regions: StoryGeometry['regions'] = {
    application: measureRegion(application ?? null, storyRect),
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
