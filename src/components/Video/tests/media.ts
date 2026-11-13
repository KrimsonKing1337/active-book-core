type MediaState = {
  paused: boolean;
  ended: boolean;
};

let states = new WeakMap<HTMLMediaElement, MediaState>();

const mediaState = (element: HTMLMediaElement): MediaState => {
  let state = states.get(element);

  if (!state) {
    state = { paused: true, ended: false };
    states.set(element, state);
  }

  return state;
};

export const startMedia = (element: HTMLMediaElement, result = Promise.resolve()) => {
  const state = mediaState(element);
  state.paused = false;
  state.ended = false;
  element.dispatchEvent(new Event('play'));

  return result;
};

export const finishMedia = (element: HTMLMediaElement) => {
  const state = mediaState(element);
  state.paused = true;
  state.ended = true;
  element.dispatchEvent(new Event('ended'));
};

export const installMedia = () => {
  states = new WeakMap();
  const prototype = HTMLMediaElement.prototype;
  jest.spyOn(prototype, 'paused', 'get').mockImplementation(function (this: HTMLMediaElement) {
    return mediaState(this).paused;
  });
  jest.spyOn(prototype, 'ended', 'get').mockImplementation(function (this: HTMLMediaElement) {
    return mediaState(this).ended;
  });
  const play = jest.spyOn(prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    return startMedia(this);
  });
  const pause = jest.spyOn(prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
    const state = mediaState(this);

    if (!state.paused) {
      state.paused = true;
      queueMicrotask(() => this.dispatchEvent(new Event('pause')));
    }
  });
  const load = jest.spyOn(prototype, 'load').mockImplementation(() => {});

  return {
    play,
    pause,
    load,
  };
};

export const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    resolve,
    reject,
  };
};
