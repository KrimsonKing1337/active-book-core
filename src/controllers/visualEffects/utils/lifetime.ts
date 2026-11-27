import type { EffectLifetime } from '@active-book/types';

export { isEffectActive as isVisualEffectActive } from '@utils/effects/lifetime';

export const validateVisualLifetime = (lifetime: EffectLifetime, pages: number): void => {
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
    const hasIntegerBounds = Number.isInteger(rangeCur.from) && Number.isInteger(rangeCur.to);
    if (!hasIntegerBounds || rangeCur.from < 1 || rangeCur.to < 1) {
      throw new Error('Visual effect range bounds must be positive integers');
    }

    if (rangeCur.from > rangeCur.to) {
      throw new Error(`Visual effect range is reversed: ${rangeCur.from}..${rangeCur.to}`);
    }
  }
};
