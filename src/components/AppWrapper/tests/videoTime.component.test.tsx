import { StrictMode } from 'react';

import {
  act,
  cleanup,
  render,
} from '@testing-library/react';

import {
  StoreProvider,
  store,
  useSelector,
} from '@store';
import { mainActions, mainSelectors } from '@store/main';
import { effectsActions } from '@store/effects/common';

import { Video } from '@components/Video';
import { VideoPlaybackContext } from '@components/Video/context';
import { installMedia } from '@components/Video/tests/media';

import { useDeleteAllVideosWithoutDataIdOnThePage } from '../hooks';

type PageProps = {
  id: string;
  src: string;
  dialog?: boolean;
};

const isCurrentWindow = () => true;

const Page = ({
  id,
  src,
  dialog,
}: PageProps) => {
  const page = useSelector(mainSelectors.page);
  useDeleteAllVideosWithoutDataIdOnThePage();
  let scope = null;

  if (dialog) {
    scope = { isCurrentWindow };
  }

  return (
    <VideoPlaybackContext value={scope}>
      <Video
        key={page}
        id={id}
        src={src}
        autoPlay={false}
      />
    </VideoPlaybackContext>
  );
};

const view = (props: PageProps) => (
  <StrictMode>
    <StoreProvider>
      <Page {...props} />
    </StoreProvider>
  </StrictMode>
);

const videoElement = () => {
  const video = document.querySelector('video');

  if (!video) {
    throw new Error('Missing page video');
  }

  return video;
};

beforeEach(() => {
  installMedia();
  jest.spyOn(HTMLMediaElement.prototype, 'readyState', 'get').mockReturnValue(1);
  store.dispatch(mainActions.setStoryPages(['first', 'second']));
  store.dispatch(mainActions.setPage(1));
  store.dispatch(effectsActions.setVideosCurrentTime({}));
});

afterEach(async () => {
  await act(async () => cleanup());
  jest.restoreAllMocks();
});

test('page changes and remounts preserve the latest position when the ID remains present', () => {
  store.dispatch(effectsActions.setVideosCurrentTime({ shared: 4, absent: 9 }));
  const props = { id: 'shared', src: 'first.webm' };
  const { unmount } = render(view(props));
  const first = videoElement();
  expect(first.currentTime).toBe(4);
  first.currentTime = 6;
  act(() => first.dispatchEvent(new Event('timeupdate')));
  act(() => store.dispatch(mainActions.setPage(2)));
  expect(videoElement()).not.toBe(first);
  expect(videoElement().currentTime).toBe(6);
  expect(store.getState().effects.videosCurrentTime).toEqual({ shared: 6 });
  act(() => store.dispatch(mainActions.setPage(1)));
  expect(videoElement().currentTime).toBe(6);
  unmount();
  render(view(props));
  expect(videoElement().currentTime).toBe(6);
});

test('source and ID replacements retain the existing zero reset through page-cache filtering', () => {
  store.dispatch(effectsActions.setVideosCurrentTime({ shared: 4 }));
  const { rerender } = render(view({ id: 'shared', src: 'first.webm' }));
  rerender(view({ id: 'shared', src: 'second.webm' }));
  expect(videoElement().currentTime).toBe(0);
  act(() => store.dispatch(mainActions.setPage(2)));
  expect(store.getState().effects.videosCurrentTime).toEqual({ shared: 0 });
  rerender(view({ id: 'different', src: 'third.webm' }));
  act(() => store.dispatch(mainActions.setPage(1)));
  expect(videoElement().currentTime).toBe(0);
  expect(store.getState().effects.videosCurrentTime).toEqual({ different: 0 });
});

test('a dialog keeps its separate position policy even when its ID has a retained page-cache entry', () => {
  store.dispatch(effectsActions.setVideosCurrentTime({ shared: 18 }));
  const props = {
    id: 'shared',
    src: 'dialog.webm',
    dialog: true,
  };
  const { unmount } = render(view(props));
  expect(videoElement().currentTime).toBe(0);
  videoElement().currentTime = 3;
  act(() => videoElement().dispatchEvent(new Event('timeupdate')));
  unmount();
  expect(store.getState().effects.videosCurrentTime).toEqual({ shared: 18 });
  render(view(props));
  expect(videoElement().currentTime).toBe(0);
});
