import {
  type PayloadAction,
  createSlice,
  nanoid,
} from '@reduxjs/toolkit';

import type {
  OpenWindowOptions,
  State,
  WindowSession,
  WindowTarget,
} from './@types';

export const initialState: State = {
  sessionId: null,
  pageId: null,
  activeWindow: null,
};

type OpenReducerAction = PayloadAction<OpenWindowOptions & {
  instanceId: string;
  canClose: boolean;
}>;

const slice = createSlice({
  name: '@windows',
  initialState,
  reducers: {
    synchronizeSession(state, action: PayloadAction<WindowSession>) {
      const { sessionId, pageId } = action.payload;

      if (state.sessionId !== sessionId || state.pageId !== pageId) {
        state.activeWindow = null;
        state.sessionId = sessionId;
        state.pageId = pageId;
      }
    },
    endSession(state, action: PayloadAction<string>) {
      if (state.sessionId === action.payload) {
        return initialState;
      }
    },
    open: {
      prepare(options: OpenWindowOptions) {
        return {
          payload: {
            ...options,
            instanceId: nanoid(),
            canClose: options.canClose ?? true,
          },
        };
      },
      reducer(state, action: OpenReducerAction) {
        const {
          sessionId,
          pageId,
          instanceId,
          contentId,
          canClose,
        } = action.payload;

        if (state.sessionId !== sessionId || state.pageId !== pageId) {
          return;
        }

        state.activeWindow = {
          instanceId,
          contentId,
          canClose,
        };
      },
    },
    requestClose(state, action: PayloadAction<WindowTarget>) {
      const { sessionId, instanceId } = action.payload;

      const active = state.activeWindow;

      if (state.sessionId === sessionId && active?.instanceId === instanceId && active.canClose) {
        state.activeWindow = null;
      }
    },
    forceClose(state, action: PayloadAction<WindowTarget>) {
      const { sessionId, instanceId } = action.payload;

      if (state.sessionId === sessionId && state.activeWindow?.instanceId === instanceId) {
        state.activeWindow = null;
      }
    },
  },
});

export const { actions, reducer } = slice;
