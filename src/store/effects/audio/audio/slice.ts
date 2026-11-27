import type { Draft, PayloadAction } from '@reduxjs/toolkit';

import { createSlice } from '@reduxjs/toolkit';

import type { HowlInst } from '@types';

import type { RemoveAudioInstancePayload, State } from './@types';

export const initialState: State = {
  audioInstances: {},
};

// Асинхронное удаление старого звука не должно удалить его замену.
const unregisterAudioInstance = (state: Draft<State>, payload: RemoveAudioInstancePayload) => {
  const { id, instance } = payload;

  if (state.audioInstances[id] === instance) {
    delete state.audioInstances[id];
  }
};

const slice = createSlice({
  name: '@effects/audio',
  initialState,
  reducers: {
    setAudioInstance(state, action: PayloadAction<HowlInst>) {
      const instance = action.payload;

      if (!instance) {
        return;
      }

      state.audioInstances[instance.id] = instance;
    },

    removeAudioInstance(state, action: PayloadAction<RemoveAudioInstancePayload>) {
      unregisterAudioInstance(state, action.payload);
    },

    unregisterAudioInstance(state, action: PayloadAction<RemoveAudioInstancePayload>) {
      unregisterAudioInstance(state, action.payload);
    },
  },
});

export const { actions, reducer } = slice;
