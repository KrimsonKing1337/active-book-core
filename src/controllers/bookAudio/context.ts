import { createContext } from 'react';

import type { BookAudio } from './BookAudio';

export const BookAudioContext = createContext<BookAudio | null>(null);
