import { StrictMode } from 'react';

import {
  act,
  cleanup,
  render,
} from '@testing-library/react';

import { StoreProvider } from '@store';

import { CarouselSlideActiveContext } from '@components/Carousel/context';
import { startToPlayAllVideosWithPlayOnLoad } from '@components/AppWrapper/utils';
import { DialogMedia } from '@components/ColoredTextTrigger/WithModal/DialogMedia';

import { Video } from '../Video';

import { installMedia } from './media';
import { resetReadiness } from './view';

let media: ReturnType<typeof installMedia>;

beforeEach(() => {
  media = installMedia();
  resetReadiness();
});

afterEach(async () => {
  await act(async () => cleanup());
  jest.restoreAllMocks();
});

test('the global autoplay pass starts only ordinary page videos', async () => {
  const { container } = render(
    <div>
      <video data-autoplay="true" data-testid="ordinary" />
      <video data-autoplay="true" data-video-managed="true" />

      <div data-book-carousel>
        <video data-autoplay="true" />
      </div>

      <div data-video-scope="dialog">
        <video data-autoplay="true" />
      </div>
    </div>,
  );
  await act(async () => startToPlayAllVideosWithPlayOnLoad());
  expect(media.play.mock.instances).toEqual([container.querySelector('[data-testid="ordinary"]')]);
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
