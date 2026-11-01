import type { VisualEffectLifetime } from '@active-book/types';

export const isVisualEffectActive = (lifetime: VisualEffectLifetime, page: number): boolean => {
  if (lifetime.type === 'page') {
    return lifetime.page === page;
  }

  return lifetime.range.some((rangeCur) => page >= rangeCur.from && page <= rangeCur.to);
};

export const validateVisualLifetime = (lifetime: VisualEffectLifetime, pages: number): void => {
  const validatePage = (page: number) => {
    if (!Number.isInteger(page) || page < 1 || page > pages) {
      throw new Error(`Visual effect page must be an integer between 1 and ${pages}: ${page}`);
    }
  };

  if (lifetime.type === 'page') {
    validatePage(lifetime.page);

    return;
  }

  for (const rangeCur of lifetime.range) {
    validatePage(rangeCur.from);
    validatePage(rangeCur.to);

    if (rangeCur.from > rangeCur.to) {
      throw new Error(`Visual effect range is reversed: ${rangeCur.from}..${rangeCur.to}`);
    }
  }
};
