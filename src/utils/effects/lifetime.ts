import type { VisualEffectLifetime } from '@active-book/types';

export const isEffectActive = (lifetime: VisualEffectLifetime, page: number): boolean => {
  if (lifetime.type === 'page') {
    return lifetime.page === page;
  }

  return lifetime.range.some((rangeCur) => {
    return page >= rangeCur.from && page <= rangeCur.to;
  });
};
