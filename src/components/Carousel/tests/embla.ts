type Event = 'select' | 'reInit';

const listeners = {
  select: new Set<() => void>(),
  reInit: new Set<() => void>(),
};

export const embla = {
  index: 0,
  count: 3,
  listeners,
  reset: () => {
    embla.index = 0;
    embla.count = 3;
    listeners.select.clear();
    listeners.reInit.clear();
  },
  emit: (event: Event) => {
    listeners[event].forEach((listener) => listener());
  },
};

export const emblaApi = {
  selectedScrollSnap: () => embla.index,
  canScrollPrev: () => embla.index > 0,
  canScrollNext: () => embla.index < embla.count - 1,
  slideNodes: () => Array.from({ length: embla.count }, () => document.createElement('div')),
  on: (event: Event, listener: () => void) => {
    listeners[event].add(listener);
  },
  off: (event: Event, listener: () => void) => {
    listeners[event].delete(listener);
  },
  scrollPrev: () => {
    embla.index = Math.max(0, embla.index - 1);
    embla.emit('select');
  },
  scrollNext: () => {
    embla.index = Math.min(embla.count - 1, embla.index + 1);
    embla.emit('select');
  },
};
