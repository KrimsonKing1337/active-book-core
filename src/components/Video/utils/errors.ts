export const reportUnexpectedVideoError = (src: string | null, error: unknown) => {
  const isExpected = error instanceof DOMException
    && (error.name === 'NotAllowedError' || error.name === 'AbortError');

  if (!isExpected) {
    console.warn('Video could not start', src, error);
  }
};

export const handleVideoPlayError = (element: HTMLVideoElement, error: unknown) => {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    element.controls = true;

    return;
  }

  reportUnexpectedVideoError(element.getAttribute('src'), error);
};
