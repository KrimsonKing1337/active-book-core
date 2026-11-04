import type { JsonObject } from '@active-book/types';

export const numberParam = (params: JsonObject, name: string, fallback: number) => {
  const value = params[name];

  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

export const stringParam = (params: JsonObject, name: string, fallback: string) => {
  const value = params[name];

  return typeof value === 'string' ? value : fallback;
};
