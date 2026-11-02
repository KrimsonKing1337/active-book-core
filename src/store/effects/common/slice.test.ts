import { actions, initialState, reducer } from './slice';

test('video readiness releases its loading gate without changing other media readiness', () => {
  const state = {
    ...initialState,
    videosAmount: 2,
    dotLottieReadyAmount: 7,
    imagesReadyAmount: 3,
  };
  const ready = reducer(state, actions.setVideosReadyAmount(2));

  expect(ready.videosReadyAmount).toBe(ready.videosAmount);
  expect(ready.dotLottieReadyAmount).toBe(7);
  expect(ready.imagesReadyAmount).toBe(3);
});
