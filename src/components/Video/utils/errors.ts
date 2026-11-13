export const reportUnexpectedVideoError = (src: string | null, error: unknown) => {
  if (error instanceof DOMException) {
    const isNotAllowedError = error.name === 'NotAllowedError';
    const isAbortError = error.name === 'AbortError';

    if (isNotAllowedError || isAbortError) {
      return;
    }
  }

  console.warn('Video could not start', src, error);
};

export const handleVideoPlayError = (element: HTMLVideoElement, error: unknown) => {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    element.controls = true;

    return;
  }

  const source = element.getAttribute('src');

  reportUnexpectedVideoError(source, error);
};
