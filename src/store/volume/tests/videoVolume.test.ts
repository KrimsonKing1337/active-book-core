import { store } from '@store';

import { setMuteToAllVideos } from '@components/AppWrapper/utils';

import { actions, initialState } from '../slice';

import { volumeCases } from './volumeFixture';

let video: HTMLVideoElement;

beforeEach(() => {
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  store.dispatch(actions.setAll(initialState));
  video = document.createElement('video');
  document.body.append(video);
});

afterEach(() => {
  video.remove();
  jest.restoreAllMocks();
});

test.each(volumeCases)('video factors $global/$category/$relative survive mixer and visibility updates', (factors) => {
  const {
    global,
    category,
    relative,
  } = factors;
  const expected = global * category * relative / 1_000_000;
  video.setAttribute('data-relativeVolume', String(relative));
  store.dispatch(actions.setAll({
    ...initialState,
    global,
    videos: category,
  }));
  expect(video.volume).toBeCloseTo(expected, 12);
  store.dispatch(actions.setVideos(category));
  expect(video.volume).toBeCloseTo(expected, 12);
  store.dispatch(actions.setGlobal(global));
  expect(video.volume).toBeCloseTo(expected, 12);
  setMuteToAllVideos(true);
  expect(video.volume).toBe(0);
  setMuteToAllVideos(false);
  expect(video.volume).toBeCloseTo(expected, 12);
  store.dispatch(actions.setGlobal(0));
  store.dispatch(actions.setVideos(100));
  expect(video.volume).toBe(0);
  store.dispatch(actions.setGlobal(global));
  store.dispatch(actions.setVideos(category));
  expect(video.volume).toBeCloseTo(expected, 12);
});

test.each([
  null,
  '',
  'invalid',
  '0',
])('missing and invalid relative volume retain their fallback, unlike %s', (relative) => {
  if (relative !== null) {
    video.setAttribute('data-relativeVolume', relative);
  }

  store.dispatch(actions.setGlobal(50));
  store.dispatch(actions.setVideos(50));
  let expected = 0.25;

  if (relative === '0') {
    expected = 0;
  }

  expect(video.volume).toBe(expected);
});

test('mixer changes while hidden remain silent and visibility restores the latest settings', () => {
  video.setAttribute('data-relativeVolume', '50');
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  setMuteToAllVideos(true);
  store.dispatch(actions.setGlobal(25));
  store.dispatch(actions.setVideos(50));
  expect(video.volume).toBe(0);
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  setMuteToAllVideos(false);
  expect(video.volume).toBe(0.0625);
});
