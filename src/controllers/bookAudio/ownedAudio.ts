import type { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

// Explicit removal goes to the owner. The Redux mixer and controller only index active audio.
export const removeOwnedAudio = new WeakMap<HowlWrapper, () => void>();
