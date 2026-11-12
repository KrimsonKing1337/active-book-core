import { createContext } from 'react';

/** Ownership only. The active descriptor lives exclusively in Redux. */
export const StoryWindowSessionContext = createContext<string | null>(null);
