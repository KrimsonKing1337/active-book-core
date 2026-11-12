import {
  actions,
  initialState,
  reducer,
} from './slice';

const session = { sessionId: 'reader-a', pageId: 'page-a' };
const started = () => reducer(undefined, actions.synchronizeSession(session));

test('starts without a window and only accepts requests for the active session and page', () => {
  expect(reducer(undefined, { type: 'init' })).toEqual(initialState);
  expect(reducer(initialState, actions.open({ ...session, contentId: 'a' }))).toEqual(initialState);
  const state = started();

  expect(reducer(state, actions.open({
    ...session,
    sessionId: 'stale',
    contentId: 'a',
  }))).toEqual(state);
  expect(reducer(state, actions.open({
    ...session,
    pageId: 'old-page',
    contentId: 'a',
  }))).toEqual(state);
});

test('opening is one atomic replacement even when the previous window cannot close', () => {
  const first = actions.open({
    ...session,
    contentId: 'a',
    canClose: false,
  });
  const second = actions.open({ ...session, contentId: 'b' });
  const state = reducer(reducer(started(), first), second);

  expect(state.activeWindow).toEqual({
    instanceId: second.payload.instanceId,
    contentId: 'b',
    canClose: true,
  });
  expect(JSON.parse(JSON.stringify(state))).toEqual(state);
});

test('reopening the same content creates a new identity and rejects old user and system callbacks', () => {
  const first = actions.open({ ...session, contentId: 'a' });
  const second = actions.open({ ...session, contentId: 'a' });
  const state = reducer(reducer(started(), first), second);
  const stale = { sessionId: session.sessionId, instanceId: first.payload.instanceId };

  expect(first.payload.instanceId).not.toBe(second.payload.instanceId);
  expect(reducer(state, actions.requestClose(stale))).toEqual(state);
  expect(reducer(state, actions.forceClose(stale))).toEqual(state);
});

test('user closing checks canClose, whereas forceClose closes the matching locked window', () => {
  const open = actions.open({
    ...session,
    contentId: 'locked',
    canClose: false,
  });
  const state = reducer(started(), open);
  const target = { sessionId: session.sessionId, instanceId: open.payload.instanceId };

  expect(reducer(state, actions.requestClose(target))).toEqual(state);
  expect(reducer(state, actions.forceClose(target)).activeWindow).toBeNull();
});

test('user closing accepts the current closable window only', () => {
  const open = actions.open({ ...session, contentId: 'a' });
  const state = reducer(started(), open);
  const wrongOwner = { sessionId: 'other', instanceId: open.payload.instanceId };

  expect(reducer(state, actions.requestClose(wrongOwner))).toEqual(state);
  expect(reducer(state, actions.forceClose(wrongOwner))).toEqual(state);
  expect(reducer(state, actions.requestClose({
    sessionId: session.sessionId,
    instanceId: open.payload.instanceId,
  })).activeWindow).toBeNull();
});

test('a real page change closes locked content; synchronizing the same page preserves it', () => {
  const state = reducer(started(), actions.open({
    ...session,
    contentId: 'a',
    canClose: false,
  }));

  expect(reducer(state, actions.synchronizeSession(session))).toEqual(state);
  expect(reducer(state, actions.synchronizeSession({ ...session, pageId: 'page-b' }))).toEqual({
    ...session,
    pageId: 'page-b',
    activeWindow: null,
  });
});

test('ending a session clears its window and rejects late opens until a new session starts', () => {
  const state = reducer(started(), actions.open({
    ...session,
    contentId: 'a',
    canClose: false,
  }));
  const ended = reducer(state, actions.endSession(session.sessionId));

  expect(ended).toEqual(initialState);
  expect(reducer(ended, actions.open({ ...session, contentId: 'late' }))).toEqual(initialState);
});

test('new sessions do not inherit windows and stale teardown cannot end their ownership', () => {
  const state = reducer(started(), actions.open({ ...session, contentId: 'a' }));
  const next = { sessionId: 'reader-b', pageId: 'page-b' };
  const renewed = reducer(state, actions.synchronizeSession(next));
  const opened = reducer(renewed, actions.open({ ...next, contentId: 'b' }));

  expect(renewed.activeWindow).toBeNull();
  expect(reducer(opened, actions.endSession(session.sessionId))).toEqual(opened);
  expect(reducer(opened, actions.open({ ...session, contentId: 'stale' }))).toEqual(opened);
});
