import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { HowlInst, HowlInstances } from '@types';

import type { DeleteAudioInstancePayload } from './@types';
import type { State } from './@types';

export const initialState: State = {
  audioInstances: {},
  isDeleting: false,
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

    // Сага выгружает экземпляр и отправляет removeAudioInstance.
    // При передаче только ID удаляется текущий экземпляр (обратная совместимость).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deleteAudioInstance(_state, _action: PayloadAction<DeleteAudioInstancePayload>) {},

    removeAudioInstance(state, action: PayloadAction<{ id: string; instance: NonNullable<HowlInst> }>) {
      const { id, instance } = action.payload;

      // Асинхронное удаление старого звука не должно удалить его замену.
      if (state.audioInstances[id] !== instance) {
        return;
      }

      delete state.audioInstances[id];
    },

    setAudioInstances(state, action: PayloadAction<HowlInstances>) {
      state.audioInstances = action.payload;
    },
    setIsDeleting(state, action: PayloadAction<boolean>) {
      state.isDeleting = action.payload;
    },
  },
});

export const { actions, reducer } = slice;
