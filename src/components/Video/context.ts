import { createContext } from 'react';

// Dialog media is mounted only while active and resets instead of restoring page playback.
export const VideoPlaybackContext = createContext<'page' | 'dialog'>('page');
