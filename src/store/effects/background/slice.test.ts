import type { BackgroundEffect } from 'hooks/effects/background/@types';

import { actions, initialState, reducer } from './slice';

const image: BackgroundEffect = {
  id: 'image-one',
  kind: 'image',
  image: {
    id: 'media-one',
    src: 'forest.webp',
  },
};

const video: BackgroundEffect = {
  id: 'video-two',
  kind: 'video',
  video: {
    id: 'media-two',
    src: 'fog.webm',
  },
};

test('keeps multiple independently added background effects', () => {
  let state = reducer(initialState, actions.setEffect(image));
  state = reducer(state, actions.setEffect(video));

  expect(Object.keys(state.effects)).toEqual(['image-one', 'video-two']);
  expect(state.effects['image-one'].image?.src).toBe('forest.webp');
  expect(state.effects['video-two'].video?.src).toBe('fog.webm');
});

test('removes only the selected background effect', () => {
  let state = reducer(initialState, actions.setEffect(image));
  state = reducer(state, actions.setEffect(video));
  state = reducer(state, actions.deleteEffect('image-one'));

  expect(state.effects['image-one']).toBeUndefined();
  expect(state.effects['video-two'].kind).toBe('video');
});
