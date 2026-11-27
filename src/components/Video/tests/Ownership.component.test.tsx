import { StrictMode } from 'react';

import {
  act,
  cleanup,
  render,
} from '@testing-library/react';

import { StoreProvider, store } from '@store';
import { mainActions } from '@store/main';

import { BookPresentationContext } from '@hooks/pagePresentation/context';

import { CarouselSlideActiveContext } from '@components/Carousel/context';
import { DialogMedia } from '@components/DialogMedia';

import { Video } from '../Video';

import { installMedia } from './media';
import {
  preparePage,
  presentPage,
  resetReadiness,
  videoSession,
} from './view';

let media: ReturnType<typeof installMedia>;

beforeEach(() => {
  media = installMedia();
  resetReadiness();
});

afterEach(async () => {
  await act(async () => cleanup());
  jest.restoreAllMocks();
});

test('DialogMedia starts native video once and leaves managed playback to Video', async () => {
  const isCurrentWindow = () => true;
  const { container, unmount } = render(
    <StrictMode>
      <StoreProvider>
        <DialogMedia isMedia={false} isCurrentWindow={isCurrentWindow}>
          <Video id="managed" src="movie.webm" />

          <CarouselSlideActiveContext value={false}>
            <Video id="inactive" src="movie.webm" />
          </CarouselSlideActiveContext>

          <video src="native.webm" />
        </DialogMedia>
      </StoreProvider>
    </StrictMode>,
  );
  await act(async () => {});
  const videos = container.querySelectorAll('video');
  expect(media.play).toHaveBeenCalledTimes(2);
  expect(videos[0].paused).toBe(false);
  expect(videos[1].paused).toBe(true);
  expect(videos[2].paused).toBe(false);
  videos[0].currentTime = 6;
  videos[2].currentTime = 3;
  expect(media.load).not.toHaveBeenCalled();
  await act(async () => unmount());
  videos.forEach((video) => {
    expect(video.paused).toBe(true);
    expect(video.currentTime).toBe(0);
  });
});

test('ordinary video keeps manual playback when it outlives a page visit', async () => {
  preparePage();
  const { container } = render(
    <StrictMode>
      <StoreProvider>
        <BookPresentationContext value={videoSession}>
          <Video id="ordinary-page" src="ordinary.webm" autoPlay={false} />
        </BookPresentationContext>
      </StoreProvider>
    </StrictMode>,
  );

  const video = container.querySelector('video');

  if (!video) {
    throw new Error('Missing ordinary page video');
  }

  await act(async () => presentPage());
  await act(async () => {
    await video.play();
  });

  expect(video.paused).toBe(false);

  const pauseCountBeforeLoading = media.pause.mock.calls.length;

  await act(async () => {
    store.dispatch(mainActions.setPage(2));
  });

  expect(video.paused).toBe(false);
  expect(media.pause).toHaveBeenCalledTimes(pauseCountBeforeLoading);

  // Native controls must remain usable while other resources are loading.
  await act(async () => {
    video.pause();
  });
  await act(async () => {
    await video.play();
  });

  expect(video.paused).toBe(false);
  expect(media.pause).toHaveBeenCalledTimes(pauseCountBeforeLoading + 1);

  await act(async () => {
    presentPage();
  });

  expect(video.paused).toBe(false);
  expect(media.pause).toHaveBeenCalledTimes(pauseCountBeforeLoading + 1);
});
