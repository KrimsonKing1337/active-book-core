import { createContext } from 'react';

type DialogVideoScope = {
  isCurrentWindow: () => boolean;
};

// A scope belongs to one DialogMedia instance; null retains ordinary page ownership.
export const VideoPlaybackContext = createContext<DialogVideoScope | null>(null);
